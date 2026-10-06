import React, { useState } from 'react';
import {
  ShoppingBag,
  Plus,
  Search,
  Filter,
  Printer,
  FileText,
  MessageCircle,
  CreditCard,
  Trash2,
  Scissors,
  Calendar,
  Clock,
  User,
  AlertTriangle,
  CheckCircle,
  X,
} from 'lucide-react';
import { Commande, PieceCommande, Mesure, MaterielSupplement, Employe } from '../types';
import { db, formatFCFA, normaliserTexte } from '../services/storage';
import { genererLienWhatsApp, genererMessageCommandePrete, genererMessageRappelRdv } from '../services/whatsapp';

interface Props {
  currentUser: Employe;
  initialClientId?: number;
  onOpenRecu: (cmd: Commande) => void;
  onOpenFicheAtelier: (cmd: Commande, piece?: PieceCommande) => void;
  onOpenPaiementModal: (cmd: Commande) => void;
}

export const CommandesView: React.FC<Props> = ({
  currentUser,
  initialClientId,
  onOpenRecu,
  onOpenFicheAtelier,
  onOpenPaiementModal,
}) => {
  const [recherche, setRecherche] = useState('');
  const [filtreStatut, setFiltreStatut] = useState<string>('Tous');
  const [filtreCouturier, setFiltreCouturier] = useState<number | 'Tous'>('Tous');
  const [modalCommandeOuvert, setModalCommandeOuvert] = useState(false);
  const [modalAnnulerOuvert, setModalAnnulerOuvert] = useState(false);
  const [commandeAAnnuler, setCommandeAAnnuler] = useState<Commande | null>(null);
  const [motifAnnulation, setMotifAnnulation] = useState('');
  const [erreur, setErreur] = useState('');

  // Create Order Form State
  const clients = db.getClients();
  const couturiers = db.getEmployes().filter(e => e.role === 'Couturier' && e.statut === 'Actif');
  const typesVetements = db.getTypeVetements();

  const [formClientId, setFormClientId] = useState<number>(initialClientId || (clients[0]?.idClient || 0));
  const [formDateFin, setFormDateFin] = useState<string>(
    new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]
  );
  const [formHeureDebut, setFormHeureDebut] = useState<string>('10:00');
  const [formPieces, setFormPieces] = useState<Partial<PieceCommande>[]>([
    {
      typeVetement: typesVetements[0]?.nom || 'Boubou',
      descriptionPrecision: '',
      idCouturier: couturiers[0]?.idEmploye,
      montantCouture: typesVetements[0]?.prixBase || 6000,
      mesures: (typesVetements[0]?.mesuresRequises || []).map(m => ({ nomMesure: m, valeur: '' })),
      materielSupplements: [],
    },
  ]);
  const [formMateriaux, setFormMateriaux] = useState<{ designation: string; quantite: number; prixUnitaire: number }[]>([]);

  // Advance Payment at creation
  const [formAcompte, setFormAcompte] = useState<number>(0);
  const [formModePaiement, setFormModePaiement] = useState<'Especes' | 'Mobile Money' | 'Virement'>('Especes');

  const commandes = db.getCommandes().filter(c => !c.estSupprimee);

  const getStatutGlobal = (cmd: Commande): string => {
    if (!cmd.pieces || cmd.pieces.length === 0) return 'A faire';
    const distinct = Array.from(new Set(cmd.pieces.map(p => p.statut)));
    if (distinct.length === 1) return distinct[0];
    if (cmd.pieces.some(p => p.statut === 'Livree')) return 'Livree partiellement';
    if (cmd.pieces.some(p => p.statut === 'Terminee')) return 'Terminee partiellement';
    if (cmd.pieces.some(p => p.statut === 'En cours')) return 'En cours';
    return 'A faire';
  };

  const getStatutBadgeColor = (statut: string) => {
    switch (statut) {
      case 'Livree':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'Livree partiellement':
        return 'bg-teal-100 text-teal-800 border-teal-300';
      case 'Terminee':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'Terminee partiellement':
        return 'bg-indigo-100 text-indigo-800 border-indigo-300';
      case 'En cours':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-300';
    }
  };

  const commandesFiltrees = commandes.filter(cmd => {
    const q = normaliserTexte(recherche);
    const clientNom = cmd.client ? normaliserTexte(`${cmd.client.prenom} ${cmd.client.nom}`) : '';
    const cmdId = String(cmd.idCommande);

    if (q && !clientNom.includes(q) && !cmdId.includes(q)) return false;

    const statutGlobal = getStatutGlobal(cmd);
    if (filtreStatut !== 'Tous') {
      if (filtreStatut === 'En retard') {
        const isLate = cmd.dateFin < new Date().toISOString().split('T')[0] && statutGlobal !== 'Livree';
        if (!isLate) return false;
      } else if (statutGlobal !== filtreStatut) {
        return false;
      }
    }

    if (filtreCouturier !== 'Tous') {
      const aCouturier = cmd.pieces.some(p => p.idCouturier === filtreCouturier);
      if (!aCouturier) return false;
    }

    return true;
  });

  const handleAjouterPiece = () => {
    const defaultType = typesVetements[0];
    setFormPieces([
      ...formPieces,
      {
        typeVetement: defaultType?.nom || 'Vêtement',
        descriptionPrecision: '',
        idCouturier: couturiers[0]?.idEmploye,
        montantCouture: defaultType?.prixBase || 5000,
        mesures: (defaultType?.mesuresRequises || []).map(m => ({ nomMesure: m, valeur: '' })),
        materielSupplements: [],
      },
    ]);
  };

  const handleSupprimerPiece = (idx: number) => {
    if (formPieces.length <= 1) {
      alert('Une commande doit comporter au moins une pièce.');
      return;
    }
    setFormPieces(formPieces.filter((_, i) => i !== idx));
  };

  const handleChangeTypePiece = (idx: number, nomType: string) => {
    const typeConfig = typesVetements.find(t => t.nom === nomType);
    const updated = [...formPieces];
    updated[idx] = {
      ...updated[idx],
      typeVetement: nomType,
      montantCouture: typeConfig?.prixBase || 5000,
      mesures: (typeConfig?.mesuresRequises || []).map(m => ({ nomMesure: m, valeur: '' })),
    };
    setFormPieces(updated);
  };

  const handleChangeMesure = (pieceIdx: number, nomMesure: string, val: string) => {
    const updated = [...formPieces];
    const mesures = [...(updated[pieceIdx].mesures || [])];
    const mIdx = mesures.findIndex(m => m.nomMesure === nomMesure);
    if (mIdx >= 0) {
      mesures[mIdx].valeur = val;
    } else {
      mesures.push({ nomMesure, valeur: val });
    }
    updated[pieceIdx].mesures = mesures;
    setFormPieces(updated);
  };

  const handleCreerCommande = (e: React.FormEvent) => {
    e.preventDefault();
    setErreur('');
    if (!formClientId) {
      setErreur('Veuillez sélectionner un client.');
      return;
    }

    try {
      const couturierLookup = new Map(couturiers.map(c => [c.idEmploye, `${c.prenom} ${c.nom}`]));
      const preparedPieces = formPieces.map(p => ({
        ...p,
        couturierNom: p.idCouturier ? couturierLookup.get(p.idCouturier) : undefined,
      }));

      const mats: MaterielSupplement[] = formMateriaux.map((m, i) => ({
        idMateriel: Date.now() + i,
        designation: m.designation,
        quantite: m.quantite,
        prixUnitaire: m.prixUnitaire,
        montant: m.quantite * m.prixUnitaire,
      }));

      const nouvelleCmd = db.saveCommande(
        {
          idClient: Number(formClientId),
          dateFin: formDateFin,
          heureDebut: formHeureDebut,
          materielSupplements: mats,
        },
        preparedPieces
      );

      // Save initial down-payment if specified
      if (formAcompte > 0) {
        db.savePaiement(nouvelleCmd.idCommande, Number(formAcompte), formModePaiement);
      }

      setModalCommandeOuvert(false);
      // Reset form
      setFormAcompte(0);
      setFormMateriaux([]);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErreur(err.message);
      }
    }
  };

  const handleConfirmerAnnulation = () => {
    if (!commandeAAnnuler || !motifAnnulation.trim()) return;
    try {
      db.annulerCommande(commandeAAnnuler.idCommande, motifAnnulation);
      setModalAnnulerOuvert(false);
      setCommandeAAnnuler(null);
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
            <ShoppingBag className="w-6 h-6 text-amber-600" />
            <span>Gestion des Commandes</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Commandes multi-pièces, fiches de mesures, échéances et fiches de coupe atelier
          </p>
        </div>
        <button
          onClick={() => setModalCommandeOuvert(true)}
          className="inline-flex items-center space-x-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-md shadow-amber-600/20"
        >
          <Plus className="w-4 h-4" />
          <span>Nouvelle Commande</span>
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
            placeholder="Rechercher par # commande ou nom client..."
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-hidden"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <div className="flex items-center space-x-1 text-xs text-slate-500">
            <Filter className="w-3.5 h-3.5" />
            <span>Statut :</span>
          </div>
          <select
            value={filtreStatut}
            onChange={e => setFiltreStatut(e.target.value)}
            className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg outline-hidden font-medium text-slate-700"
          >
            <option value="Tous">Tous les statuts</option>
            <option value="A faire">À faire</option>
            <option value="En cours">En cours</option>
            <option value="Terminee">Terminée</option>
            <option value="Livree">Livrée</option>
            <option value="En retard">⚠️ En retard</option>
          </select>

          <div className="flex items-center space-x-1 text-xs text-slate-500 ml-2">
            <span>Couturier :</span>
          </div>
          <select
            value={filtreCouturier}
            onChange={e => setFiltreCouturier(e.target.value === 'Tous' ? 'Tous' : Number(e.target.value))}
            className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg outline-hidden font-medium text-slate-700"
          >
            <option value="Tous">Tous les couturiers</option>
            {couturiers.map(c => (
              <option key={c.idEmploye} value={c.idEmploye}>
                {c.prenom} {c.nom}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Commande</th>
                <th className="py-3 px-4">Client</th>
                <th className="py-3 px-4">Pièces & Couturier</th>
                <th className="py-3 px-4">Livraison</th>
                <th className="py-3 px-4">Statut</th>
                <th className="py-3 px-4 text-right">Facture & Solde</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {commandesFiltrees.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400 italic">
                    Aucune commande trouvée.
                  </td>
                </tr>
              ) : (
                commandesFiltrees.map(cmd => {
                  const statutGlobal = getStatutGlobal(cmd);
                  const isLate = cmd.dateFin < new Date().toISOString().split('T')[0] && statutGlobal !== 'Livree';
                  const totalCouture = cmd.pieces.reduce((s, p) => s + p.montantCouture, 0);
                  const totalMat = (cmd.materielSupplements || []).reduce((s, m) => s + m.montant, 0);
                  const totalFacture = totalCouture + totalMat;
                  const paye = (cmd.paiements || []).filter(p => !p.estAnnule).reduce((s, p) => s + p.montantPaye, 0);
                  const reste = Math.max(0, totalFacture - paye);

                  return (
                    <tr key={cmd.idCommande} className="hover:bg-amber-50/40 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">CMD #{cmd.idCommande}</div>
                        <span className="text-[10px] text-slate-400">
                          {new Date(cmd.dateDebut).toLocaleDateString('fr-FR')}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">
                          {cmd.client ? `${cmd.client.prenom} ${cmd.client.nom}` : 'Client Particulier'}
                        </div>
                        <span className="text-[10px] text-slate-500">{cmd.client?.telephone || '—'}</span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          {cmd.pieces.map((p, idx) => (
                            <div key={idx} className="flex items-center space-x-1.5">
                              <span className="font-bold text-slate-800">{p.typeVetement}</span>
                              <span className="text-[10px] text-slate-400">({p.couturierNom || 'Atelier'})</span>
                              <span className="text-[10px] px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded">
                                {p.statut}
                              </span>
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className={`font-semibold ${isLate ? 'text-rose-600 font-bold' : 'text-slate-800'}`}>
                          {new Date(cmd.dateFin).toLocaleDateString('fr-FR')}
                        </div>
                        <span className="text-[10px] text-slate-400">à {cmd.heureDebut || '10:00'}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 text-[11px] font-bold rounded-full border ${getStatutBadgeColor(
                            statutGlobal
                          )}`}
                        >
                          {statutGlobal}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="font-bold text-slate-900">{formatFCFA(totalFacture)}</div>
                        <div className="text-[11px]">
                          {reste === 0 ? (
                            <span className="text-emerald-600 font-semibold">Soldé ✓</span>
                          ) : (
                            <span className="text-rose-600 font-medium">Reste : {formatFCFA(reste)}</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1">
                          {/* Fiche Atelier */}
                          <button
                            onClick={() => onOpenFicheAtelier(cmd)}
                            className="p-1.5 text-slate-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                            title="Imprimer Fiche Atelier (Coupe)"
                          >
                            <Scissors className="w-4 h-4" />
                          </button>

                          {/* Reçu & Facture */}
                          <button
                            onClick={() => onOpenRecu(cmd)}
                            className="p-1.5 text-slate-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            title="Imprimer Facture / Reçu"
                          >
                            <Printer className="w-4 h-4" />
                          </button>

                          {/* Paiement */}
                          {reste > 0 && (
                            <button
                              onClick={() => onOpenPaiementModal(cmd)}
                              className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                              title="Encaisser un paiement"
                            >
                              <CreditCard className="w-4 h-4" />
                            </button>
                          )}

                          {/* WhatsApp */}
                          {cmd.client?.telephone && (
                            <a
                              href={genererLienWhatsApp(
                                cmd.client.telephone,
                                statutGlobal === 'Terminee' || statutGlobal === 'Terminee partiellement'
                                  ? genererMessageCommandePrete(cmd)
                                  : genererMessageRappelRdv(cmd)
                              )}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                              title="Envoyer un message WhatsApp"
                            >
                              <MessageCircle className="w-4 h-4" />
                            </a>
                          )}

                          {/* Boss delete */}
                          {currentUser.role === 'Boss' && (
                            <button
                              onClick={() => {
                                setCommandeAAnnuler(cmd);
                                setMotifAnnulation('');
                                setModalAnnulerOuvert(true);
                              }}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Supprimer la commande (Boss)"
                            >
                              <Trash2 className="w-4 h-4" />
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

      {/* Modal: New Order */}
      {modalCommandeOuvert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white shrink-0">
              <div className="flex items-center space-x-2">
                <ShoppingBag className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-sm">Nouvelle Commande Multi-Pièces</h3>
              </div>
              <button
                onClick={() => setModalCommandeOuvert(false)}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <form onSubmit={handleCreerCommande} className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
              {erreur && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{erreur}</span>
                </div>
              )}

              {/* Client and Deadlines */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Client *</label>
                  <select
                    value={formClientId}
                    onChange={e => setFormClientId(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-hidden font-medium"
                    required
                  >
                    {clients.map(c => (
                      <option key={c.idClient} value={c.idClient}>
                        {c.prenom} {c.nom} ({c.telephone || 'Sans tél'})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Date de livraison *</label>
                  <input
                    type="date"
                    value={formDateFin}
                    onChange={e => setFormDateFin(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-hidden"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Heure de RDV</label>
                  <input
                    type="time"
                    value={formHeureDebut}
                    onChange={e => setFormHeureDebut(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-hidden"
                  />
                </div>
              </div>

              {/* Pieces Management */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                    Vêtements & Pièces ({formPieces.length})
                  </h4>
                  <button
                    type="button"
                    onClick={handleAjouterPiece}
                    className="px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-lg font-bold flex items-center space-x-1 cursor-pointer transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Ajouter un vêtement</span>
                  </button>
                </div>

                {formPieces.map((piece, pIdx) => (
                  <div key={pIdx} className="p-4 bg-white border-2 border-slate-200 rounded-xl space-y-4 relative">
                    <div className="flex items-center justify-between border-b pb-2">
                      <span className="font-black text-slate-800 text-xs uppercase">
                        Pièce #{pIdx + 1}
                      </span>
                      {formPieces.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleSupprimerPiece(pIdx)}
                          className="text-rose-500 hover:text-rose-700 font-semibold cursor-pointer"
                        >
                          Supprimer
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Type de vêtement</label>
                        <select
                          value={piece.typeVetement}
                          onChange={e => handleChangeTypePiece(pIdx, e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-hidden font-medium"
                        >
                          {typesVetements.map(t => (
                            <option key={t.id} value={t.nom}>
                              {t.nom} (Base: {formatFCFA(t.prixBase)})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Couturier assigné</label>
                        <select
                          value={piece.idCouturier}
                          onChange={e => {
                            const updated = [...formPieces];
                            updated[pIdx].idCouturier = Number(e.target.value);
                            setFormPieces(updated);
                          }}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-hidden font-medium"
                        >
                          {couturiers.map(c => (
                            <option key={c.idEmploye} value={c.idEmploye}>
                              {c.prenom} {c.nom}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Prix de confection (FCFA)</label>
                        <input
                          type="number"
                          value={piece.montantCouture || 0}
                          onChange={e => {
                            const updated = [...formPieces];
                            updated[pIdx].montantCouture = Number(e.target.value);
                            setFormPieces(updated);
                          }}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-hidden font-bold text-slate-900"
                          min="0"
                          step="500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Description / Précision du modèle</label>
                      <input
                        type="text"
                        value={piece.descriptionPrecision || ''}
                        onChange={e => {
                          const updated = [...formPieces];
                          updated[pIdx].descriptionPrecision = e.target.value;
                          setFormPieces(updated);
                        }}
                        placeholder="ex: Col officier, manches courtes, broderie fil doré aux poches..."
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-hidden"
                      />
                    </div>

                    {/* Dynamic Measurements */}
                    <div>
                      <span className="block font-bold text-slate-700 mb-2 uppercase tracking-wider text-[11px]">
                        Mesures personnalisées (en cm)
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2">
                        {(piece.mesures || []).map((m, mIdx) => (
                          <div key={mIdx} className="bg-slate-50 p-2 rounded border border-slate-200">
                            <label className="block text-[10px] text-slate-500 font-semibold mb-1 truncate">
                              {m.nomMesure}
                            </label>
                            <input
                              type="text"
                              value={m.valeur || ''}
                              onChange={e => handleChangeMesure(pIdx, m.nomMesure, e.target.value)}
                              placeholder="cm"
                              className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs font-bold text-slate-900 focus:ring-1 focus:ring-amber-500 outline-hidden"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Initial Advance Payment */}
              <div className="bg-amber-50/70 p-4 rounded-xl border border-amber-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <span className="font-bold text-amber-950 text-xs block">Acompte à l'enregistrement (optionnel)</span>
                  <span className="text-[11px] text-amber-800">
                    Enregistrer immédiatement l'avance versée par le client avec reçu automatique.
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    value={formAcompte}
                    onChange={e => setFormAcompte(Number(e.target.value))}
                    placeholder="Montant FCFA"
                    className="w-36 px-3 py-2 bg-white border border-amber-300 rounded-lg font-bold text-slate-900 text-xs outline-hidden"
                    min="0"
                    step="1000"
                  />
                  <select
                    value={formModePaiement}
                    onChange={e => setFormModePaiement(e.target.value as any)}
                    className="px-3 py-2 bg-white border border-amber-300 rounded-lg font-medium text-xs outline-hidden"
                  >
                    <option value="Especes">Espèces</option>
                    <option value="Mobile Money">Mobile Money</option>
                    <option value="Virement">Virement</option>
                  </select>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setModalCommandeOuvert(false)}
                  className="px-5 py-2.5 border border-slate-300 rounded-xl text-slate-700 font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold transition-colors cursor-pointer shadow-md shadow-amber-600/20"
                >
                  Valider la Commande
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Boss Order Cancellation */}
      {modalAnnulerOuvert && commandeAAnnuler && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="px-6 py-4 bg-rose-600 text-white flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="font-bold text-sm">Annulation de Commande #{commandeAAnnuler.idCommande}</h3>
            </div>
            <div className="p-6 space-y-4 text-xs">
              <p className="text-slate-600">
                Cette action supprimera logiquement la commande de la liste active. L'historique et la traçabilité seront
                conservés de manière immuable dans le Journal d'Audit.
              </p>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Motif obligatoire d'annulation *</label>
                <textarea
                  value={motifAnnulation}
                  onChange={e => setMotifAnnulation(e.target.value)}
                  placeholder="ex: Client a annulé son événement, tissu défectueux avant coupe..."
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-rose-500 outline-hidden"
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
                  onClick={handleConfirmerAnnulation}
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
