import React, { useState } from 'react';
import {
  Layers,
  Scissors,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowRight,
  Printer,
  User,
  Filter,
  PackageCheck,
  X,
} from 'lucide-react';
import { Commande, PieceCommande, Employe } from '../types';
import { db, formatFCFA } from '../services/storage';

interface Props {
  currentUser: Employe;
  onOpenFicheAtelier: (cmd: Commande, piece: PieceCommande) => void;
  onSelectCommande: (cmd: Commande) => void;
}

export const StatutView: React.FC<Props> = ({ currentUser, onOpenFicheAtelier, onSelectCommande }) => {
  const isCouturier = currentUser.role === 'Couturier';
  const couturiers = db.getEmployes().filter(e => e.role === 'Couturier');

  const [filtreCouturier, setFiltreCouturier] = useState<number | 'Tous'>(
    isCouturier ? currentUser.idEmploye : 'Tous'
  );

  // Unpaid delivery modal for Boss
  const [modalLivraisonNonSoldee, setModalLivraisonNonSoldee] = useState<{
    cmd: Commande;
    piece: PieceCommande;
    reste: number;
  } | null>(null);
  const [motifLivraison, setMotifLivraison] = useState('');

  const commandes = db.getCommandes().filter(c => !c.estSupprimee);
  const todayStr = new Date().toISOString().split('T')[0];

  // Flatten all pieces with their parent command
  const allPiecesWithCmd: { piece: PieceCommande; cmd: Commande }[] = [];
  commandes.forEach(cmd => {
    cmd.pieces.forEach(p => {
      if (filtreCouturier === 'Tous' || p.idCouturier === filtreCouturier) {
        allPiecesWithCmd.push({ piece: p, cmd });
      }
    });
  });

  const colonnes: { id: PieceCommande['statut']; titre: string; couleur: string }[] = [
    { id: 'A faire', titre: 'À Faire / En Attente', couleur: 'border-slate-300 bg-slate-50' },
    { id: 'En cours', titre: 'En Cours de Confection', couleur: 'border-amber-400 bg-amber-50/40' },
    { id: 'Terminee', titre: 'Terminée / Prête', couleur: 'border-blue-400 bg-blue-50/40' },
    { id: 'Livree', titre: 'Livrée au Client', couleur: 'border-emerald-400 bg-emerald-50/40' },
  ];

  const handleChangerStatut = (cmd: Commande, piece: PieceCommande, nouveauStatut: PieceCommande['statut']) => {
    try {
      if (nouveauStatut === 'Livree') {
        const totalCouture = cmd.pieces.reduce((s, p) => s + p.montantCouture, 0);
        const totalMat = (cmd.materielSupplements || []).reduce((s, m) => s + m.montant, 0);
        const paye = (cmd.paiements || []).filter(p => !p.estAnnule).reduce((s, p) => s + p.montantPaye, 0);
        const reste = totalCouture + totalMat - paye;

        if (reste > 0.01) {
          if (currentUser.role !== 'Boss') {
            alert(
              `Impossible de livrer : la commande #${cmd.idCommande} n'est pas soldée (Reste : ${formatFCFA(
                reste
              )}). Seul le Boss peut forcer la livraison avec un motif justifié.`
            );
            return;
          }
          // Boss: open confirmation modal
          setModalLivraisonNonSoldee({ cmd, piece, reste });
          setMotifLivraison('');
          return;
        }
      }

      db.updatePieceStatut(cmd.idCommande, piece.idPieceCommande, nouveauStatut);
    } catch (err: unknown) {
      if (err instanceof Error) {
        alert(err.message);
      }
    }
  };

  const handleConfirmerLivraisonNonSoldee = () => {
    if (!modalLivraisonNonSoldee || !motifLivraison.trim()) return;
    try {
      db.updatePieceStatut(
        modalLivraisonNonSoldee.cmd.idCommande,
        modalLivraisonNonSoldee.piece.idPieceCommande,
        'Livree',
        motifLivraison
      );
      setModalLivraisonNonSoldee(null);
      setMotifLivraison('');
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
            <Layers className="w-6 h-6 text-amber-600" />
            <span>{isCouturier ? 'Mon Tableau d\'Atelier' : 'Suivi de Confection en Atelier'}</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Tableau Kanban par étape de confection • Progression des pièces et respect des délais
          </p>
        </div>

        {!isCouturier && (
          <div className="flex items-center space-x-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-semibold text-slate-600">Filtrer couturier :</span>
            <select
              value={filtreCouturier}
              onChange={e => setFiltreCouturier(e.target.value === 'Tous' ? 'Tous' : Number(e.target.value))}
              className="font-medium bg-transparent text-slate-800 outline-hidden cursor-pointer"
            >
              <option value="Tous">Tous les couturiers</option>
              {couturiers.map(c => (
                <option key={c.idEmploye} value={c.idEmploye}>
                  {c.prenom} {c.nom}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-start">
        {colonnes.map(col => {
          const piecesColonne = allPiecesWithCmd.filter(item => item.piece.statut === col.id);
          return (
            <div key={col.id} className="bg-slate-100/80 rounded-2xl p-4 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between px-1">
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700 flex items-center space-x-1.5">
                  <span className={`w-2.5 h-2.5 rounded-full ${col.id === 'Livree' ? 'bg-emerald-500' : col.id === 'Terminee' ? 'bg-blue-500' : col.id === 'En cours' ? 'bg-amber-500' : 'bg-slate-400'}`} />
                  <span>{col.titre}</span>
                </h3>
                <span className="px-2 py-0.5 bg-white text-slate-700 font-bold rounded-full text-xs shadow-xs border border-slate-200">
                  {piecesColonne.length}
                </span>
              </div>

              {/* Cards List */}
              <div className="space-y-3 min-h-[150px]">
                {piecesColonne.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-xs italic">Aucune pièce ici.</div>
                ) : (
                  piecesColonne.map(({ piece, cmd }) => {
                    const isLate = cmd.dateFin < todayStr && piece.statut !== 'Livree';
                    return (
                      <div
                        key={`${cmd.idCommande}-${piece.idPieceCommande}`}
                        className="bg-white rounded-xl p-4 border border-slate-200/90 shadow-xs hover:shadow-md transition-all space-y-3"
                      >
                        {/* Card Top */}
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                              CMD #{cmd.idCommande}
                            </span>
                            <h4 className="font-black text-slate-900 text-sm">{piece.typeVetement}</h4>
                          </div>
                          <button
                            onClick={() => onOpenFicheAtelier(cmd, piece)}
                            className="p-1 text-slate-400 hover:text-amber-700 hover:bg-amber-50 rounded transition-colors cursor-pointer"
                            title="Imprimer Fiche Atelier"
                          >
                            <Scissors className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Client & Description */}
                        <div className="text-xs space-y-1">
                          <p className="font-semibold text-slate-800">
                            {cmd.client ? `${cmd.client.prenom} ${cmd.client.nom}` : 'Client'}
                          </p>
                          {piece.descriptionPrecision && (
                            <p className="text-slate-500 text-[11px] line-clamp-2">
                              {piece.descriptionPrecision}
                            </p>
                          )}
                        </div>

                        {/* Tailor & Deadline */}
                        <div className="flex justify-between items-center text-[11px] border-t border-slate-100 pt-2 text-slate-500">
                          <span>✂️ {piece.couturierNom || 'Atelier'}</span>
                          <span className={`font-semibold ${isLate ? 'text-rose-600 font-bold' : ''}`}>
                            📅 {new Date(cmd.dateFin).toLocaleDateString('fr-FR')}
                          </span>
                        </div>

                        {/* Action buttons to advance status */}
                        <div className="pt-1 flex items-center justify-between gap-1">
                          {col.id === 'A faire' && (
                            <button
                              onClick={() => handleChangerStatut(cmd, piece, 'En cours')}
                              className="w-full py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold rounded-lg text-[11px] transition-colors flex items-center justify-center space-x-1 cursor-pointer"
                            >
                              <span>Démarrer Confection</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {col.id === 'En cours' && (
                            <button
                              onClick={() => handleChangerStatut(cmd, piece, 'Terminee')}
                              className="w-full py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-900 font-bold rounded-lg text-[11px] transition-colors flex items-center justify-center space-x-1 cursor-pointer"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Marquer Prête ✓</span>
                            </button>
                          )}

                          {col.id === 'Terminee' && (
                            <button
                              onClick={() => handleChangerStatut(cmd, piece, 'Livree')}
                              className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[11px] transition-colors flex items-center justify-center space-x-1 cursor-pointer shadow-xs"
                            >
                              <PackageCheck className="w-3.5 h-3.5" />
                              <span>Livrer au Client</span>
                            </button>
                          )}

                          {col.id === 'Livree' && (
                            <span className="text-[11px] text-emerald-600 font-bold flex items-center space-x-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Remis au client</span>
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Unpaid Delivery Force by Boss */}
      {modalLivraisonNonSoldee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="px-6 py-4 bg-amber-600 text-white flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="font-bold text-sm">Autorisation Boss : Commande Non Soldée</h3>
            </div>
            <div className="p-6 space-y-4 text-xs">
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 space-y-1">
                <p>
                  La commande #{modalLivraisonNonSoldee.cmd.idCommande} présente un solde restant de{' '}
                  <strong>{formatFCFA(modalLivraisonNonSoldee.reste)}</strong>.
                </p>
                <p className="text-[11px] text-amber-800">
                  En tant que Boss, vous pouvez autoriser la livraison. Cette dérogation sera inscrite au Journal d'Audit.
                </p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Motif de la remise sans paiement total *</label>
                <textarea
                  value={motifLivraison}
                  onChange={e => setMotifLivraison(e.target.value)}
                  placeholder="ex: Client fidèle régulier, promesse de virement sous 48h, caution versée..."
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-hidden"
                  required
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  onClick={() => setModalLivraisonNonSoldee(null)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-slate-50 cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  onClick={handleConfirmerLivraisonNonSoldee}
                  disabled={!motifLivraison.trim()}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold disabled:opacity-50 cursor-pointer"
                >
                  Autoriser la Livraison
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
