import React from 'react';
import { X, Printer, Scissors, User, Calendar, Clock, AlertTriangle } from 'lucide-react';
import { Commande, PieceCommande } from '../types';
import { db } from '../services/storage';

interface Props {
  commande: Commande;
  piece?: PieceCommande;
  onClose: () => void;
}

export const FicheAtelierModal: React.FC<Props> = ({ commande, piece, onClose }) => {
  const params = db.getParametres();
  const client = commande.client;

  const piecesToShow = piece ? [piece] : commande.pieces;

  const handlePrint = () => {
    window.print();
  };

  const isUrgent = new Date(commande.dateFin).getTime() - Date.now() < 3 * 86400000;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Header toolbar (hidden on print) */}
        <div className="print:hidden flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
          <div className="flex items-center space-x-2">
            <Scissors className="w-5 h-5 text-amber-400" />
            <span className="font-semibold">Fiche d'Atelier — Commande #{commande.idCommande}</span>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handlePrint}
              className="inline-flex items-center space-x-2 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-medium rounded-lg text-sm transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimer Ticket</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Ticket Content */}
        <div id="printable-atelier" className="p-8 text-slate-900 space-y-6">
          {/* Header */}
          <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4">
            <div>
              <div className="flex items-center space-x-2">
                <Scissors className="w-6 h-6 text-slate-900" />
                <h1 className="text-xl font-black uppercase tracking-wider">{params.nomAtelier}</h1>
              </div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mt-1">
                FICHE DE COUPE & CONFECTION ATELIER
              </p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black px-3 py-1 bg-slate-100 rounded border border-slate-300">
                CMD #{commande.idCommande}
              </span>
              {isUrgent && (
                <div className="flex items-center space-x-1 text-rose-600 text-xs font-bold mt-1 justify-end">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>DÉLAI COURT</span>
                </div>
              )}
            </div>
          </div>

          {/* Client & Date Info */}
          <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-300 text-xs">
            <div className="space-y-1">
              <div className="flex items-center space-x-1.5 text-slate-500">
                <User className="w-3.5 h-3.5" />
                <span className="font-semibold uppercase tracking-wider">Client</span>
              </div>
              <p className="text-sm font-bold text-slate-900">{client ? `${client.prenom} ${client.nom}` : 'Client'}</p>
              <p className="text-slate-600">Tél : {client?.telephone || '—'}</p>
            </div>
            <div className="space-y-1 text-right">
              <div className="flex items-center space-x-1.5 text-slate-500 justify-end">
                <Calendar className="w-3.5 h-3.5" />
                <span className="font-semibold uppercase tracking-wider">Date de Livraison Impérative</span>
              </div>
              <p className="text-base font-black text-rose-700">
                {new Date(commande.dateFin).toLocaleDateString('fr-FR', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
              <p className="text-slate-600 flex items-center justify-end space-x-1">
                <Clock className="w-3.5 h-3.5" />
                <span>Heure : {commande.heureDebut || '10:00'}</span>
              </p>
            </div>
          </div>

          {/* Pieces and Measurements */}
          <div className="space-y-6">
            {piecesToShow.map((p, idx) => (
              <div key={idx} className="border-2 border-slate-300 rounded-lg p-5 bg-white space-y-4">
                <div className="flex justify-between items-center border-b pb-2 border-slate-200">
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 bg-slate-900 text-white text-xs font-bold rounded">
                      Pièce {idx + 1}
                    </span>
                    <h2 className="text-lg font-black uppercase text-slate-900">{p.typeVetement}</h2>
                  </div>
                  <div className="text-xs">
                    <span className="text-slate-500">Couturier assigné : </span>
                    <strong className="text-slate-900 bg-amber-100 px-2 py-0.5 rounded border border-amber-300">
                      {p.couturierNom || 'Non assigné'}
                    </strong>
                  </div>
                </div>

                {p.descriptionPrecision && (
                  <div className="bg-amber-50/60 p-2.5 rounded border border-amber-200 text-xs">
                    <span className="font-bold text-amber-900">Instructions de coupe & modèle : </span>
                    <span className="text-slate-800">{p.descriptionPrecision}</span>
                  </div>
                )}

                {/* Measurements Grid */}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                    Mesures Prises (en cm)
                  </h3>
                  {p.mesures && p.mesures.length > 0 ? (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 text-xs">
                      {p.mesures.map((m, mIdx) => (
                        <div
                          key={mIdx}
                          className="bg-slate-50 border border-slate-200 p-2 rounded flex justify-between items-center"
                        >
                          <span className="text-slate-600 font-medium">{m.nomMesure} :</span>
                          <span className="font-black text-slate-900 text-sm">{m.valeur} cm</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">Aucune mesure spécifique enregistrée.</p>
                  )}
                </div>

                {/* Materials/accessories */}
                {p.materielSupplements && p.materielSupplements.length > 0 && (
                  <div className="text-xs bg-slate-50 p-2 rounded border border-slate-200">
                    <span className="font-bold text-slate-700">Fournitures réservées : </span>
                    {p.materielSupplements.map(m => `${m.designation} (x${m.quantite})`).join(', ')}
                  </div>
                )}

                {/* Checklist & Tailor Signature */}
                <div className="grid grid-cols-3 gap-3 pt-3 border-t border-slate-200 text-[11px] text-slate-500">
                  <div className="border border-dashed border-slate-300 p-2 rounded text-center">
                    <div className="h-6"></div>
                    <span className="block border-t pt-1 font-semibold">1. Coupe validée</span>
                  </div>
                  <div className="border border-dashed border-slate-300 p-2 rounded text-center">
                    <div className="h-6"></div>
                    <span className="block border-t pt-1 font-semibold">2. Assemblage fini</span>
                  </div>
                  <div className="border border-dashed border-slate-300 p-2 rounded text-center">
                    <div className="h-6"></div>
                    <span className="block border-t pt-1 font-semibold">3. Contrôle Qualité</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
