import React, { useState } from 'react';
import {
  Award,
  Calendar,
  Percent,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Ban,
  Clock,
  User,
  ShieldAlert,
} from 'lucide-react';
import { Employe, ApercuCommissionItem, Commission } from '../types';
import { db, formatFCFA } from '../services/storage';

interface Props {
  currentUser: Employe;
}

export const CommissionsView: React.FC<Props> = ({ currentUser }) => {
  const isBoss = currentUser.role === 'Boss';
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

  const [dateDebut, setDateDebut] = useState(firstDay);
  const [dateFin, setDateFin] = useState(lastDay);
  const [pourcentage, setPourcentage] = useState(30);
  const [surMontantEncaisse, setSurMontantEncaisse] = useState(true);
  const [idCouturierFiltre, setIdCouturierFiltre] = useState<number | 'Tous'>('Tous');

  const [apercu, setApercu] = useState<ApercuCommissionItem[] | null>(null);
  const [onglet, setOnglet] = useState<'calcul' | 'historique'>('calcul');
  const [message, setMessage] = useState('');
  const [erreur, setErreur] = useState('');

  // Cancel commission modal
  const [commissionAAnnuler, setCommissionAAnnuler] = useState<Commission | null>(null);
  const [motifAnnulation, setMotifAnnulation] = useState('');

  const couturiers = db.getEmployes().filter(e => e.role === 'Couturier' && e.statut === 'Actif');
  const historique = db.getCommissions();

  const handleCalculerApercu = () => {
    setErreur('');
    setMessage('');
    try {
      const filtre = idCouturierFiltre === 'Tous' ? undefined : Number(idCouturierFiltre);
      const res = db.calculerApercuCommission(dateDebut, dateFin, pourcentage, surMontantEncaisse, filtre);
      setApercu(res);
      if (res.length === 0) {
        setMessage('Aucune pièce achevée éligible trouvée pour cette période (ou pièces déjà verrouillées).');
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErreur(err.message);
      }
    }
  };

  const handleEnregistrer = () => {
    if (!apercu || apercu.length === 0) return;
    try {
      db.enregistrerCommissions(apercu, dateDebut, dateFin, pourcentage, surMontantEncaisse);
      setMessage('✅ Commissions enregistrées et pièces verrouillées avec succès !');
      setApercu(null);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErreur(err.message);
      }
    }
  };

  const handleConfirmerAnnulationCommission = () => {
    if (!commissionAAnnuler || !motifAnnulation.trim()) return;
    try {
      db.annulerCommission(commissionAAnnuler.idCommission, motifAnnulation);
      setCommissionAAnnuler(null);
      setMotifAnnulation('');
      setMessage('Commission annulée et pièces déverrouillées avec succès.');
    } catch (err: unknown) {
      if (err instanceof Error) {
        alert(err.message);
      }
    }
  };

  if (!isBoss) {
    return (
      <div className="p-8 text-center text-slate-500">
        <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto mb-2" />
        <h2 className="text-lg font-bold text-slate-900">Accès Réservé au Boss</h2>
        <p className="text-xs mt-1">Le calcul et le versement des commissions nécessitent les privilèges Administrateur.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 flex items-center space-x-2">
            <Award className="w-6 h-6 text-amber-600" />
            <span>Commissions & Primes des Couturiers</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Calcul rigoureux au prorata des encaissements • Verrouillage des pièces • Bonus qualité
          </p>
        </div>

        {/* Tab switch */}
        <div className="inline-flex rounded-xl border border-slate-200 p-1 bg-white shadow-xs text-xs font-semibold">
          <button
            onClick={() => setOnglet('calcul')}
            className={`px-4 py-1.5 rounded-lg transition-all cursor-pointer ${
              onglet === 'calcul' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Calcul & Aperçu
          </button>
          <button
            onClick={() => setOnglet('historique')}
            className={`px-4 py-1.5 rounded-lg transition-all cursor-pointer ${
              onglet === 'historique' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Historique ({historique.length})
          </button>
        </div>
      </div>

      {message && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {erreur && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{erreur}</span>
        </div>
      )}

      {onglet === 'calcul' ? (
        <div className="space-y-6">
          {/* Filter Configuration Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4 text-xs">
            <h2 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
              Paramètres du calcul de commissions
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Date début période</label>
                <input
                  type="date"
                  value={dateDebut}
                  onChange={e => setDateDebut(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Date fin période</label>
                <input
                  type="date"
                  value={dateFin}
                  onChange={e => setDateFin(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Pourcentage commission (%)</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    value={pourcentage}
                    onChange={e => setPourcentage(Number(e.target.value))}
                    min="1"
                    max="100"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-bold outline-hidden"
                  />
                  <span className="text-slate-400 font-bold">%</span>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Couturier</label>
                <select
                  value={idCouturierFiltre}
                  onChange={e => setIdCouturierFiltre(e.target.value === 'Tous' ? 'Tous' : Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-hidden font-medium"
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

            {/* Base Choice */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100">
              <div className="flex items-center space-x-4">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={surMontantEncaisse}
                    onChange={() => setSurMontantEncaisse(true)}
                    className="text-amber-600 focus:ring-amber-500"
                  />
                  <span className="font-semibold text-slate-800">
                    Sur montants encaissés réels (Règle recommandée)
                  </span>
                </label>

                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={!surMontantEncaisse}
                    onChange={() => setSurMontantEncaisse(false)}
                    className="text-amber-600 focus:ring-amber-500"
                  />
                  <span className="text-slate-600">Sur montant total couture facturé</span>
                </label>
              </div>

              <button
                type="button"
                onClick={handleCalculerApercu}
                className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold cursor-pointer transition-colors shadow-md shadow-amber-600/20"
              >
                Générer l'Aperçu
              </button>
            </div>
          </div>

          {/* Preview Results Table */}
          {apercu && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden space-y-4 p-5">
              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <h3 className="text-sm font-black text-slate-900 uppercase">
                    Aperçu avant Validation ({apercu.length} couturier(s) éligible(s))
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Seules les pièces terminées/livrées sans retouche non résolue sont éligibles.
                  </p>
                </div>
                {apercu.length > 0 && (
                  <button
                    onClick={handleEnregistrer}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer shadow-md shadow-emerald-600/20"
                  >
                    Valider & Enregistrer Définitivement
                  </button>
                )}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Couturier</th>
                      <th className="py-2.5 px-3 text-center">Pièces / Cmds</th>
                      <th className="py-2.5 px-3 text-right">CA Couture Pièces</th>
                      <th className="py-2.5 px-3 text-right">Encaissé Prorata</th>
                      <th className="py-2.5 px-3 text-right">Prime Qualité</th>
                      <th className="py-2.5 px-3 text-right font-bold text-slate-900">Commission Totale</th>
                      <th className="py-2.5 px-3 text-right">Reste Atelier</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {apercu.map(item => {
                      const totalCouturier = item.commission + item.primeQualite;
                      const resteAtelier = item.caEncaisse - item.commission;

                      return (
                        <tr key={item.idEmploye} className="hover:bg-amber-50/40">
                          <td className="py-3 px-3 font-bold text-slate-900">{item.nom}</td>
                          <td className="py-3 px-3 text-center">
                            <span className="px-2 py-0.5 bg-slate-100 rounded text-slate-700 font-medium">
                              {item.idsPieces.length} pièces ({item.nbCommandes} cmds)
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right font-medium text-slate-700">
                            {formatFCFA(item.caTotal)}
                          </td>
                          <td className="py-3 px-3 text-right font-semibold text-emerald-700">
                            {formatFCFA(item.caEncaisse)}
                          </td>
                          <td className="py-3 px-3 text-right">
                            {item.primeQualite > 0 ? (
                              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded text-[10px]">
                                +{formatFCFA(item.primeQualite)} ⭐
                              </span>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-right font-black text-amber-700 text-sm">
                            {formatFCFA(totalCouturier)}
                          </td>
                          <td className="py-3 px-3 text-right font-medium text-slate-600">
                            {formatFCFA(resteAtelier)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Commission History Tab */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Date Calcul</th>
                  <th className="py-3 px-4">Couturier</th>
                  <th className="py-3 px-4">Période</th>
                  <th className="py-3 px-4">Taux</th>
                  <th className="py-3 px-4 text-right">Montant Versé</th>
                  <th className="py-3 px-4 text-center">Statut</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {historique.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400 italic">
                      Aucun historique de commission enregistré.
                    </td>
                  </tr>
                ) : (
                  historique.map(c => (
                    <tr
                      key={c.idCommission}
                      className={`hover:bg-amber-50/40 transition-colors ${c.estAnnulee ? 'opacity-50 bg-slate-50' : ''}`}
                    >
                      <td className="py-3 px-4 font-semibold text-slate-800">
                        {new Date(c.dateCalcul).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">{c.nomEmployeSnapshot}</td>
                      <td className="py-3 px-4 text-slate-600">
                        {new Date(c.dateDebutPeriode).toLocaleDateString('fr-FR')} →{' '}
                        {new Date(c.dateFinPeriode).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="py-3 px-4">{c.pourcentage}% ({c.baseCalcul})</td>
                      <td className="py-3 px-4 text-right font-black text-slate-900 text-sm">
                        {formatFCFA(c.montantCommission + (c.primeQualite || 0))}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {c.estAnnulee ? (
                          <span
                            className="px-2 py-0.5 bg-rose-100 text-rose-800 font-bold text-[10px] rounded uppercase cursor-help"
                            title={`Annulé par ${c.nomAnnulateur} : ${c.motifAnnulation}`}
                          >
                            Annulée
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold text-[10px] rounded uppercase">
                            Validée
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {!c.estAnnulee && (
                          <button
                            onClick={() => {
                              setCommissionAAnnuler(c);
                              setMotifAnnulation('');
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Annuler cette commission et déverrouiller les pièces"
                          >
                            <Ban className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Cancel Commission */}
      {commissionAAnnuler && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="px-6 py-4 bg-rose-600 text-white flex items-center space-x-2">
              <Ban className="w-5 h-5" />
              <h3 className="font-bold text-sm">Annulation de Commission #{commissionAAnnuler.idCommission}</h3>
            </div>
            <div className="p-6 space-y-4 text-xs">
              <p className="text-slate-600">
                Couturier : <strong>{commissionAAnnuler.nomEmployeSnapshot}</strong>. Cette opération déverrouillera les{' '}
                {commissionAAnnuler.piecesIds?.length || 0} pièce(s) afin qu'elles puissent être recalculées ultérieurement.
              </p>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Motif obligatoire d'annulation *</label>
                <textarea
                  value={motifAnnulation}
                  onChange={e => setMotifAnnulation(e.target.value)}
                  placeholder="ex: Erreur de pourcentage, réclamation couturier, régularisation..."
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 outline-hidden"
                  required
                />
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <button
                  onClick={() => setCommissionAAnnuler(null)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-slate-50 cursor-pointer"
                >
                  Fermer
                </button>
                <button
                  onClick={handleConfirmerAnnulationCommission}
                  disabled={!motifAnnulation.trim()}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold disabled:opacity-50 cursor-pointer"
                >
                  Confirmer le déverrouillage
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
