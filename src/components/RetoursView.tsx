import React, { useState } from 'react';
import {
  RotateCcw,
  Plus,
  CheckCircle,
  AlertTriangle,
  Clock,
  User,
  X,
  Calendar,
} from 'lucide-react';
import { Retour, Employe, Commande } from '../types';
import { db } from '../services/storage';

interface Props {
  currentUser: Employe;
}

export const RetoursView: React.FC<Props> = ({ currentUser }) => {
  const [modalOuvert, setModalOuvert] = useState(false);
  const [erreur, setErreur] = useState('');

  // Form state
  const commandes = db.getCommandes().filter(c => !c.estSupprimee);
  const couturiers = db.getEmployes().filter(e => e.role === 'Couturier');

  const [idCommande, setIdCommande] = useState<number>(commandes[0]?.idCommande || 0);
  const cmdActuelle = commandes.find(c => c.idCommande === idCommande);
  const [idPiece, setIdPiece] = useState<number>(cmdActuelle?.pieces[0]?.idPieceCommande || 0);
  const [descriptionProbleme, setDescriptionProbleme] = useState('');
  const [idCouturierReprise, setIdCouturierReprise] = useState<number>(couturiers[0]?.idEmploye || 0);
  const [dateRdvReprise, setDateRdvReprise] = useState(
    new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0]
  );

  const retours = db.getRetours();

  const handleCreerRetour = (e: React.FormEvent) => {
    e.preventDefault();
    setErreur('');
    if (!idCommande || !idPiece) {
      setErreur('Veuillez sélectionner une commande et une pièce.');
      return;
    }
    if (!descriptionProbleme.trim()) {
      setErreur('La description du défaut est obligatoire.');
      return;
    }

    try {
      db.saveRetour({
        idCommande,
        idPieceCommande: idPiece,
        descriptionProbleme,
        idCouturierReprise,
        dateRdvReprise,
      });
      setModalOuvert(false);
      setDescriptionProbleme('');
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErreur(err.message);
      }
    }
  };

  const handleChangerStatut = (idRetour: number, nouveauStatut: Retour['statut']) => {
    try {
      db.updateRetourStatut(idRetour, nouveauStatut);
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
            <RotateCcw className="w-6 h-6 text-amber-600" />
            <span>Retours / Reprises Gratuites Sous Garantie</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Prise en charge des ajustements après essayage • Coût 0 FCFA • Suivi du couturier responsable
          </p>
        </div>
        <button
          onClick={() => {
            setModalOuvert(true);
            setErreur('');
          }}
          className="inline-flex items-center space-x-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-md shadow-amber-600/20"
        >
          <Plus className="w-4 h-4" />
          <span>Signaler un Retour</span>
        </button>
      </div>

      {/* Retours List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Date Signalement</th>
                <th className="py-3 px-4">Commande & Pièce</th>
                <th className="py-3 px-4">Défaut signalé</th>
                <th className="py-3 px-4">Couturiers</th>
                <th className="py-3 px-4">RDV Reprise</th>
                <th className="py-3 px-4 text-center">Statut</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {retours.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 italic">
                    Aucun retour ni retouche en cours.
                  </td>
                </tr>
              ) : (
                retours.map(r => {
                  const cmd = commandes.find(c => c.idCommande === r.idCommande);
                  const piece = cmd?.pieces.find(p => p.idPieceCommande === r.idPieceCommande);
                  const cInit = couturiers.find(c => c.idEmploye === r.idCouturier);
                  const cRepr = couturiers.find(c => c.idEmploye === r.idCouturierReprise);

                  return (
                    <tr key={r.idRetour} className="hover:bg-amber-50/30 transition-colors">
                      <td className="py-3 px-4 font-semibold text-slate-800">
                        {new Date(r.dateSignalement).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">
                          CMD #{r.idCommande} — {piece?.typeVetement || 'Vêtement'}
                        </div>
                        <span className="text-[10px] text-slate-500">
                          Client : {cmd?.client?.prenom} {cmd?.client?.nom}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-700 max-w-xs">{r.descriptionProbleme}</td>
                      <td className="py-3 px-4 text-slate-600">
                        <div>
                          Origine : <strong className="text-slate-800">{cInit?.prenom || '—'}</strong>
                        </div>
                        {r.idCouturierReprise !== r.idCouturier && (
                          <div className="text-[10px] text-amber-700">
                            Reprise par : {cRepr?.prenom}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-700">
                        {r.dateRdvReprise ? new Date(r.dateRdvReprise).toLocaleDateString('fr-FR') : '—'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full font-bold text-[10px] uppercase border ${
                            r.statut === 'Rendu'
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                              : r.statut === 'Pret'
                              ? 'bg-blue-100 text-blue-800 border-blue-300'
                              : r.statut === 'En reprise'
                              ? 'bg-amber-100 text-amber-800 border-amber-300'
                              : 'bg-rose-100 text-rose-800 border-rose-300'
                          }`}
                        >
                          {r.statut === 'Signale' ? 'Signalé' : r.statut === 'Pret' ? 'Prêt ✓' : r.statut}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1">
                          {r.statut === 'Signale' && (
                            <button
                              onClick={() => handleChangerStatut(r.idRetour, 'En reprise')}
                              className="px-2 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded font-bold text-[11px] cursor-pointer"
                            >
                              Prendre en charge
                            </button>
                          )}
                          {r.statut === 'En reprise' && (
                            <button
                              onClick={() => handleChangerStatut(r.idRetour, 'Pret')}
                              className="px-2 py-1 bg-blue-100 hover:bg-blue-200 text-blue-900 rounded font-bold text-[11px] cursor-pointer"
                            >
                              Marquer Prêt ✓
                            </button>
                          )}
                          {r.statut === 'Pret' && (
                            <button
                              onClick={() => handleChangerStatut(r.idRetour, 'Rendu')}
                              className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold text-[11px] cursor-pointer"
                            >
                              Rendu au client
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

      {/* Modal: New Retour */}
      {modalOuvert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
            <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
              <div className="flex items-center space-x-2">
                <RotateCcw className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-sm">Signaler une Reprise / Retouche Gratuite</h3>
              </div>
              <button
                onClick={() => setModalOuvert(false)}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreerRetour} className="p-6 space-y-4 text-xs">
              {erreur && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{erreur}</span>
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 mb-1">Commande concernée *</label>
                <select
                  value={idCommande}
                  onChange={e => {
                    const cid = Number(e.target.value);
                    setIdCommande(cid);
                    const selected = commandes.find(c => c.idCommande === cid);
                    if (selected && selected.pieces[0]) {
                      setIdPiece(selected.pieces[0].idPieceCommande);
                      setIdCouturierReprise(selected.pieces[0].idCouturier || couturiers[0]?.idEmploye || 0);
                    }
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-hidden font-medium"
                  required
                >
                  {commandes.map(c => (
                    <option key={c.idCommande} value={c.idCommande}>
                      CMD #{c.idCommande} — {c.client?.prenom} {c.client?.nom}
                    </option>
                  ))}
                </select>
              </div>

              {cmdActuelle && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Pièce à retoucher *</label>
                  <select
                    value={idPiece}
                    onChange={e => setIdPiece(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-hidden font-medium"
                    required
                  >
                    {cmdActuelle.pieces.map(p => (
                      <option key={p.idPieceCommande} value={p.idPieceCommande}>
                        {p.typeVetement} (Couturier : {p.couturierNom || 'Atelier'})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 mb-1">Couturier désigné pour la reprise</label>
                <select
                  value={idCouturierReprise}
                  onChange={e => setIdCouturierReprise(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-hidden font-medium"
                >
                  {couturiers.map(c => (
                    <option key={c.idEmploye} value={c.idEmploye}>
                      {c.prenom} {c.nom}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Description détaillée du défaut / ajustement *</label>
                <textarea
                  value={descriptionProbleme}
                  onChange={e => setDescriptionProbleme(e.target.value)}
                  placeholder="ex: Raccourcir le pantalon de 2 cm, cintrer la taille de la veste..."
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-hidden"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Date RDV pour récupérer le vêtement</label>
                <input
                  type="date"
                  value={dateRdvReprise}
                  onChange={e => setDateRdvReprise(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-hidden font-medium"
                  required
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setModalOuvert(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold cursor-pointer shadow-md shadow-amber-600/20"
                >
                  Enregistrer la Reprise
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
