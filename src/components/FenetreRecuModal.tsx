import React from 'react';
import { X, Printer, CheckCircle, FileText } from 'lucide-react';
import { Commande, Paiement } from '../types';
import { db, formatFCFA } from '../services/storage';

interface Props {
  commande: Commande;
  paiement?: Paiement;
  onClose: () => void;
}

export const FenetreRecuModal: React.FC<Props> = ({ commande, paiement, onClose }) => {
  const params = db.getParametres();
  const client = commande.client;

  const totalCouture = commande.pieces.reduce((s, p) => s + p.montantCouture, 0);
  const totalMateriaux = (commande.materielSupplements || []).reduce((s, m) => s + m.montant, 0);
  const totalFacture = totalCouture + totalMateriaux;
  const paiementsValides = (commande.paiements || []).filter(p => !p.estAnnule);
  const totalEncaisse = paiementsValides.reduce((s, p) => s + p.montantPaye, 0);
  const resteAPayer = Math.max(0, totalFacture - totalEncaisse);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Header toolbar (hidden when printing) */}
        <div className="print:hidden flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-amber-400" />
            <span className="font-semibold">Reçu & Facture — Commande #{commande.idCommande}</span>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handlePrint}
              className="inline-flex items-center space-x-2 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-medium rounded-lg text-sm transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimer</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Receipt Content */}
        <div id="printable-receipt" className="p-8 text-slate-800 space-y-6">
          {/* Atelier Brand Header */}
          <div className="text-center border-b pb-4 border-slate-200">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 uppercase">{params.nomAtelier}</h1>
            <p className="text-sm text-slate-500 font-medium">Atelier de Haute Couture & Retouche Sur-Mesure</p>
            <p className="text-xs text-slate-500 mt-1">{params.adresse} • Tél: {params.telephone}</p>
          </div>

          {/* Receipt / Invoice Meta */}
          <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-lg border border-slate-200">
            <div>
              <p className="text-slate-500 uppercase tracking-wider font-semibold">Client</p>
              <p className="text-sm font-bold text-slate-900 mt-0.5">{client ? `${client.prenom} ${client.nom}` : 'Client Particulier'}</p>
              <p className="text-slate-600">Tél : {client?.telephone || '—'}</p>
            </div>
            <div className="text-right">
              <p className="text-slate-500 uppercase tracking-wider font-semibold">Document</p>
              <p className="text-sm font-bold text-slate-900 mt-0.5">
                {paiement ? paiement.recuNumero : `FACTURE #${commande.idCommande}`}
              </p>
              <p className="text-slate-600">
                Date : {new Date(paiement ? paiement.datePaiement : commande.dateDebut).toLocaleDateString('fr-FR', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
              <p className="text-slate-600">
                Livraison prévue : {new Date(commande.dateFin).toLocaleDateString('fr-FR')}
              </p>
            </div>
          </div>

          {/* Items Table */}
          <div>
            <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden">
              <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Désignation</th>
                  <th className="py-2.5 px-3">Couturier</th>
                  <th className="py-2.5 px-3 text-right">Montant</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {commande.pieces.map((p, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-slate-900">{p.typeVetement}</div>
                      {p.descriptionPrecision && (
                        <div className="text-slate-500 text-[11px]">{p.descriptionPrecision}</div>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">{p.couturierNom || 'Atelier'}</td>
                    <td className="py-2.5 px-3 text-right font-medium text-slate-900">{formatFCFA(p.montantCouture)}</td>
                  </tr>
                ))}
                {(commande.materielSupplements || []).map((m, i) => (
                  <tr key={`mat-${i}`} className="bg-slate-50/50">
                    <td className="py-2.5 px-3 text-slate-700" colSpan={2}>
                      <span className="font-medium">Fourniture :</span> {m.designation} (x{m.quantite})
                    </td>
                    <td className="py-2.5 px-3 text-right font-medium text-slate-900">{formatFCFA(m.montant)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals and Payment Summary */}
          <div className="flex justify-end pt-2">
            <div className="w-64 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Total Couture :</span>
                <span>{formatFCFA(totalCouture)}</span>
              </div>
              {totalMateriaux > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>Fournitures / Tissus :</span>
                  <span>{formatFCFA(totalMateriaux)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-slate-900 text-sm border-t border-slate-200 pt-2">
                <span>Montant Total :</span>
                <span className="text-amber-700">{formatFCFA(totalFacture)}</span>
              </div>
              <div className="flex justify-between text-emerald-700 font-semibold">
                <span>Total Encaissé :</span>
                <span>{formatFCFA(totalEncaisse)}</span>
              </div>
              <div className="flex justify-between font-bold text-sm border-t border-slate-200 pt-2 text-slate-900">
                <span>Reste à Payer :</span>
                <span className={resteAPayer > 0 ? 'text-rose-600' : 'text-emerald-600'}>
                  {formatFCFA(resteAPayer)}
                </span>
              </div>
            </div>
          </div>

          {/* Payment Status Stamp */}
          <div className="flex items-center justify-between border-t border-slate-200 pt-4">
            <div className="flex items-center space-x-2 text-xs text-slate-500">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span>
                Opérateur : <strong className="text-slate-700">{paiement?.nomOperateur || commande.nomOperateurCreation}</strong>
              </span>
            </div>
            {resteAPayer === 0 ? (
              <span className="px-3 py-1 bg-emerald-100 text-emerald-800 font-bold uppercase tracking-wider text-xs rounded border border-emerald-300">
                FACTURE SOLDÉE
              </span>
            ) : (
              <span className="px-3 py-1 bg-amber-100 text-amber-800 font-bold uppercase tracking-wider text-xs rounded border border-amber-300">
                ACOMPTE VERSÉ
              </span>
            )}
          </div>

          {/* Footer notice */}
          <p className="text-[11px] text-slate-400 text-center italic border-t pt-3">
            {params.noteRecu}
          </p>
        </div>
      </div>
    </div>
  );
};
