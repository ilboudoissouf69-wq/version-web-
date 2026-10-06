import React, { useState } from 'react';
import {
  CreditCard,
  Plus,
  Search,
  Filter,
  Printer,
  X,
  AlertTriangle,
  FileCheck,
  Ban,
  Calendar,
  User,
  ArrowRight,
} from 'lucide-react';
import { Paiement, Commande, Employe } from '../types';
import { db, formatFCFA, normaliserTexte } from '../services/storage';

interface Props {
  currentUser: Employe;
  initialCommande?: Commande;
  onOpenRecuForPaiement: (cmd: Commande, p: Paiement) => void;
}

export const PaiementsView: React.FC<Props> = ({ currentUser, initialCommande, onOpenRecuForPaiement }) => {
  const [recherche, setRecherche] = useState('');
  const [filtreStatut, setFiltreStatut] = useState<'Tous' | 'Valides' | 'Annules'>('Valides');
  const [modalNouveauPaiement, setModalNouveauPaiement] = useState(!!initialCommande);
  const [commandeSelectionneeId, setCommandeSelectionneeId] = useState<number>(initialCommande?.idCommande || 0);
  const [montantSaisi, setMontantSaisi] = useState<number>(0);
  const [modeSaisi, setModeSaisi] = useState<Paiement['modePaiement']>('Especes');
  const [erreur, setErreur] = useState('');

  // Cancel payment state
  const [modalAnnulerOuvert, setModalAnnulerOuvert] = useState(false);
  const [paiementAAnnuler, setPaiementAAnnuler] = useState<Paiement | null>(null);
  const [motifAnnulation, setMotifAnnulation] = useState('');

  const paiements = db.getPaiements();
  const commandes = db.getCommandes().filter(c => !c.estSupprimee);

  // Commandes with remaining balance > 0
  const commandesNonSoldees = commandes.filter(cmd => {
    const totalCouture = cmd.pieces.reduce((s, p) => s + p.montantCouture, 0);
    const totalMat = (cmd.materielSupplements || []).reduce((s, m) => s + m.montant, 0);
    const paye = (cmd.paiements || []).filter(p => !p.estAnnule).reduce((s, p) => s + p.montantPaye, 0);
    return totalCouture + totalMat - paye > 0.01;
  });

  const cmdActuelle = commandes.find(c => c.idCommande === commandeSelectionneeId);
  const resteCmdActuelle = cmdActuelle
    ? cmdActuelle.pieces.reduce((s, p) => s + p.montantCouture, 0) +
      (cmdActuelle.materielSupplements || []).reduce((s, m) => s + m.montant, 0) -
      (cmdActuelle.paiements || []).filter(p => !p.estAnnule).reduce((s, p) => s + p.montantPaye, 0)
    : 0;

  const paiementsFiltres = paiements.filter(p => {
    if (filtreStatut === 'Valides' && p.estAnnule) return false;
    if (filtreStatut === 'Annules' && !p.estAnnule) return false;

    const q = normaliserTexte(recherche);
    if (!q) return true;
    const num = normaliserTexte(p.recuNumero);
    const op = normaliserTexte(p.nomOperateur);
    const cmd = commandes.find(c => c.idCommande === p.idCommande);
    const client = cmd?.client ? normaliserTexte(`${cmd.client.prenom} ${cmd.client.nom}`) : '';

    return num.includes(q) || op.includes(q) || client.includes(q);
  });

  const handleEnregistrerPaiement = (e: React.FormEvent) => {
    e.preventDefault();
    setErreur('');
    if (!commandeSelectionneeId) {
      setErreur('Veuillez sélectionner une commande.');
      return;
    }
    if (montantSaisi <= 0) {
      setErreur('Le montant doit être supérieur à zéro.');
      return;
    }

    try {
      const p = db.savePaiement(commandeSelectionneeId, Number(montantSaisi), modeSaisi);
      setModalNouveauPaiement(false);
      setMontantSaisi(0);
      const cmd = db.getCommandeById(commandeSelectionneeId);
      if (cmd) {
        onOpenRecuForPaiement(cmd, p);
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErreur(err.message);
      }
    }
  };

  const handleConfirmerAnnulationPaiement = () => {
    if (!paiementAAnnuler || !motifAnnulation.trim()) return;
    try {
      db.annulerPaiement(paiementAAnnuler.idPaiement, motifAnnulation);
      setModalAnnulerOuvert(false);
      setPaiementAAnnuler(null);
      setMotifAnnulation('');
    } catch (err: unknown) {
      if (err instanceof Error) {
        alert(err.message);
      }
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 flex items-center space-x-2">
            <CreditCard className="w-6 h-6 text-amber-600" />
            <span>Paiements & Encaissements</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Émission de reçus uniques, acomptes, soldes et traçabilité comptable
          </p>
        </div>
        <button
          onClick={() => {
            setCommandeSelectionneeId(commandesNonSoldees[0]?.idCommande || 0);
            setMontantSaisi(0);
            setErreur('');
            setModalNouveauPaiement(true);
          }}
          className="inline-flex items-center space-x-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-md shadow-amber-600/20"
        >
          <Plus className="w-4 h-4" />
          <span>Encaisser un Paiement</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={recherche}
            onChange={e => setRecherche(e.target.value)}
            placeholder="Rechercher par n° reçu, client ou opérateur..."
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-hidden"
          />
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs font-semibold text-slate-500">Afficher :</span>
          <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-100 text-xs">
            <button
              onClick={() => setFiltreStatut('Valides')}
              className={`px-3 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                filtreStatut === 'Valides' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Valides
            </button>
            <button
              onClick={() => setFiltreStatut('Annules')}
              className={`px-3 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                filtreStatut === 'Annules' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Annulés
            </button>
            <button
              onClick={() => setFiltreStatut('Tous')}
              className={`px-3 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                filtreStatut === 'Tous' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Tous
            </button>
          </div>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">N° Reçu & Date</th>
                <th className="py-3 px-4">Commande & Client</th>
                <th className="py-3 px-4">Mode</th>
                <th className="py-3 px-4">Opérateur</th>
                <th className="py-3 px-4 text-right">Montant Encaissé</th>
                <th className="py-3 px-4 text-center">Statut</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paiementsFiltres.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400 italic">
                    Aucun paiement enregistré.
                  </td>
                </tr>
              ) : (
                paiementsFiltres.map(p => {
                  const cmd = commandes.find(c => c.idCommande === p.idCommande);
                  const client = cmd?.client;

                  return (
                    <tr
                      key={p.idPaiement}
                      className={`hover:bg-amber-50/40 transition-colors ${p.estAnnule ? 'opacity-60 bg-slate-50/50' : ''}`}
                    >
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{p.recuNumero}</div>
                        <span className="text-[10px] text-slate-400">
                          {new Date(p.datePaiement).toLocaleDateString('fr-FR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-800">
                          CMD #{p.idCommande} — {client ? `${client.prenom} ${client.nom}` : 'Client'}
                        </div>
                        <span className="text-[10px] text-slate-500">
                          {cmd?.pieces.map(pc => pc.typeVetement).join(' + ')}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-700">
                        <span className="px-2 py-0.5 bg-slate-100 rounded text-[11px] border border-slate-200">
                          {p.modePaiement}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600">{p.nomOperateur}</td>
                      <td className="py-3 px-4 text-right font-black text-slate-900 text-sm">
                        {formatFCFA(p.montantPaye)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {p.estAnnule ? (
                          <span
                            className="px-2 py-0.5 bg-rose-100 text-rose-800 font-bold text-[10px] rounded uppercase cursor-help"
                            title={`Annulé par ${p.nomAnnulateur} : ${p.motifsAnnulation}`}
                          >
                            Annulé
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold text-[10px] rounded uppercase">
                            Valide
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          {cmd && (
                            <button
                              onClick={() => onOpenRecuForPaiement(cmd, p)}
                              className="p-1.5 text-slate-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                              title="Imprimer le Reçu de Caisse"
                            >
                              <Printer className="w-4 h-4" />
                            </button>
                          )}

                          {!p.estAnnule && currentUser.role === 'Boss' && (
                            <button
                              onClick={() => {
                                setPaiementAAnnuler(p);
                                setMotifAnnulation('');
                                setModalAnnulerOuvert(true);
                              }}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Annuler ce paiement (Boss uniquement)"
                            >
                              <Ban className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: New Payment */}
      {modalNouveauPaiement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
            <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
              <div className="flex items-center space-x-2">
                <CreditCard className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-sm">Enregistrer un Encaissement</h3>
              </div>
              <button
                onClick={() => setModalNouveauPaiement(false)}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEnregistrerPaiement} className="p-6 space-y-4 text-xs">
              {erreur && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{erreur}</span>
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 mb-1">Sélectionner la commande à encaisser *</label>
                <select
                  value={commandeSelectionneeId}
                  onChange={e => {
                    const id = Number(e.target.value);
                    setCommandeSelectionneeId(id);
                    const cmd = commandes.find(c => c.idCommande === id);
                    if (cmd) {
                      const totalCouture = cmd.pieces.reduce((s, p) => s + p.montantCouture, 0);
                      const totalMat = (cmd.materielSupplements || []).reduce((s, m) => s + m.montant, 0);
                      const paye = (cmd.paiements || []).filter(p => !p.estAnnule).reduce((s, p) => s + p.montantPaye, 0);
                      const r = totalCouture + totalMat - paye;
                      setMontantSaisi(r > 0 ? r : 0);
                    }
                  }}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-hidden font-medium"
                  required
                >
                  <option value={0}>Sélectionnez une commande...</option>
                  {commandesNonSoldees.map(c => {
                    const totalCouture = c.pieces.reduce((s, p) => s + p.montantCouture, 0);
                    const totalMat = (c.materielSupplements || []).reduce((s, m) => s + m.montant, 0);
                    const paye = (c.paiements || []).filter(p => !p.estAnnule).reduce((s, p) => s + p.montantPaye, 0);
                    const reste = totalCouture + totalMat - paye;
                    return (
                      <option key={c.idCommande} value={c.idCommande}>
                        CMD #{c.idCommande} — {c.client?.prenom} {c.client?.nom} (Reste : {formatFCFA(reste)})
                      </option>
                    );
                  })}
                </select>
              </div>

              {cmdActuelle && (
                <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Client :</span>
                    <strong className="text-slate-900">
                      {cmdActuelle.client?.prenom} {cmdActuelle.client?.nom}
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Reste exact à régler :</span>
                    <strong className="text-amber-800 text-sm">{formatFCFA(resteCmdActuelle)}</strong>
                  </div>
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 mb-1">Montant à encaisser (FCFA) *</label>
                <input
                  type="number"
                  value={montantSaisi || ''}
                  onChange={e => setMontantSaisi(Number(e.target.value))}
                  placeholder="ex: 10000"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-hidden font-black text-slate-900"
                  min="1"
                  max={resteCmdActuelle}
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Mode de règlement *</label>
                <select
                  value={modeSaisi}
                  onChange={e => setModeSaisi(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-hidden font-medium"
                >
                  <option value="Especes">Espèces en caisse</option>
                  <option value="Mobile Money">Mobile Money (Orange / Moov / Wave)</option>
                  <option value="Virement">Virement bancaire</option>
                  <option value="Cheque">Chèque</option>
                </select>
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setModalNouveauPaiement(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold cursor-pointer shadow-md shadow-amber-600/20"
                >
                  Valider l'Encaissement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Boss Cancel Payment */}
      {modalAnnulerOuvert && paiementAAnnuler && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="px-6 py-4 bg-rose-600 text-white flex items-center space-x-2">
              <Ban className="w-5 h-5" />
              <h3 className="font-bold text-sm">Annulation de Paiement {paiementAAnnuler.recuNumero}</h3>
            </div>
            <div className="p-6 space-y-4 text-xs">
              <p className="text-slate-600">
                Montant : <strong>{formatFCFA(paiementAAnnuler.montantPaye)}</strong>. Cette opération réajustera le
                reste à payer de la commande #{paiementAAnnuler.idCommande}. Motif obligatoire pour le Journal d'Audit.
              </p>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Motif de l'annulation *</label>
                <textarea
                  value={motifAnnulation}
                  onChange={e => setMotifAnnulation(e.target.value)}
                  placeholder="ex: Erreur de saisie de montant par l'opérateur, chèque sans provision..."
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 outline-hidden"
                  required
                />
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <button
                  onClick={() => setModalAnnulerOuvert(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-slate-50 cursor-pointer"
                >
                  Fermer
                </button>
                <button
                  onClick={handleConfirmerAnnulationPaiement}
                  disabled={!motifAnnulation.trim()}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold disabled:opacity-50 cursor-pointer"
                >
                  Confirmer l'annulation
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
