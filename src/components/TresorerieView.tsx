import React, { useState } from 'react';
import {
  TrendingUp,
  DollarSign,
  Receipt,
  Award,
  Calendar,
  AlertCircle,
  CheckCircle,
  FileSpreadsheet,
  Printer,
  ShieldCheck,
} from 'lucide-react';
import { Employe } from '../types';
import { db, formatFCFA } from '../services/storage';

interface Props {
  currentUser: Employe;
}

export const TresorerieView: React.FC<Props> = ({ currentUser }) => {
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

  const [dateDebut, setDateDebut] = useState(firstDay);
  const [dateFin, setDateFin] = useState(lastDay);

  const bilan = db.calculerBilan(dateDebut, dateFin);

  // Consistency audit
  const commandes = db.getCommandes().filter(
    c => !c.estSupprimee && c.dateFin >= dateDebut && c.dateFin <= dateFin && (c.pieces.some(p => p.statut === 'Livree' || p.statut === 'Terminee'))
  );

  const totalFactureLivre = commandes.reduce((s, c) => {
    const piecesTerminees = c.pieces.filter(p => p.statut === 'Terminee' || p.statut === 'Livree');
    const couture = piecesTerminees.reduce((ps, p) => ps + p.montantCouture, 0);
    const mat = (c.materielSupplements || []).reduce((ms, m) => ms + m.montant, 0);
    return s + couture + mat;
  }, 0);

  const totalEncaisse = bilan.chiffreAffaires;
  const ecart = totalEncaisse - totalFactureLivre;
  const tolerance = totalFactureLivre * 0.15;
  const coherenceOk = Math.abs(ecart) <= (tolerance || 10000);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 flex items-center space-x-2">
            <TrendingUp className="w-6 h-6 text-amber-600" />
            <span>Trésorerie & Bilan Financier</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Bilan d'exploitation • Comptabilité de trésorerie • Audit de cohérence argent/travail
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handlePrint}
            className="inline-flex items-center space-x-1.5 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer shadow-xs"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimer Bilan</span>
          </button>
        </div>
      </div>

      {/* Date Range Picker */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center gap-4 text-xs">
        <div className="flex items-center space-x-2">
          <Calendar className="w-4 h-4 text-slate-400" />
          <span className="font-semibold text-slate-700">Période du :</span>
          <input
            type="date"
            value={dateDebut}
            onChange={e => setDateDebut(e.target.value)}
            className="px-2.5 py-1.5 border border-slate-300 rounded-lg outline-hidden font-medium"
          />
        </div>

        <div className="flex items-center space-x-2">
          <span className="font-semibold text-slate-700">au :</span>
          <input
            type="date"
            value={dateFin}
            onChange={e => setDateFin(e.target.value)}
            className="px-2.5 py-1.5 border border-slate-300 rounded-lg outline-hidden font-medium"
          />
        </div>

        {/* Quick presets */}
        <div className="flex items-center space-x-1 ml-auto">
          <button
            onClick={() => {
              const d = new Date();
              setDateDebut(new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0]);
              setDateFin(new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split('T')[0]);
            }}
            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium cursor-pointer"
          >
            Ce mois
          </button>
          <button
            onClick={() => {
              const d = new Date();
              setDateDebut(new Date(d.getFullYear(), d.getMonth() - 1, 1).toISOString().split('T')[0]);
              setDateFin(new Date(d.getFullYear(), d.getMonth(), 0).toISOString().split('T')[0]);
            }}
            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium cursor-pointer"
          >
            Mois dernier
          </button>
          <button
            onClick={() => {
              const d = new Date();
              setDateDebut(new Date(d.getFullYear(), 0, 1).toISOString().split('T')[0]);
              setDateFin(new Date(d.getFullYear(), 11, 31).toISOString().split('T')[0]);
            }}
            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium cursor-pointer"
          >
            Année {now.getFullYear()}
          </button>
        </div>
      </div>

      {/* Main Financial KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            1. Chiffre d'Affaires Encaissé
          </span>
          <p className="text-2xl font-black text-emerald-600">{formatFCFA(bilan.chiffreAffaires)}</p>
          <span className="text-[11px] text-slate-400 block">{bilan.nombrePaiements} paiements enregistrés</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            2. Dépenses Atelier
          </span>
          <p className="text-2xl font-black text-rose-600">{formatFCFA(bilan.totalDepenses)}</p>
          <span className="text-[11px] text-slate-400 block">Charges, fournitures & réparations</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            3. Commissions Couturiers
          </span>
          <p className="text-2xl font-black text-amber-600">
            {formatFCFA(bilan.totalCommissions + bilan.totalPrimesQualite)}
          </p>
          <span className="text-[11px] text-slate-400 block">Dont primes qualité : {formatFCFA(bilan.totalPrimesQualite)}</span>
        </div>

        <div className="bg-gradient-to-br from-slate-900 to-slate-950 p-5 rounded-2xl text-white shadow-md space-y-1">
          <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
            4. Bilan Net Atelier
          </span>
          <p className={`text-2xl font-black ${bilan.bilanNet >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {formatFCFA(bilan.bilanNet)}
          </p>
          <span className="text-[11px] text-slate-400 block">Bénéfice net résiduel (CA - Dépenses - Commissions)</span>
        </div>
      </div>

      {/* Breakdown Details & Consistency Audit */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Breakdown table */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4 text-xs">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Décomposition Analytique des Flux
          </h2>

          <div className="divide-y divide-slate-100 space-y-2">
            <div className="flex justify-between py-2">
              <span className="text-slate-600 font-medium">CA Confection Couture :</span>
              <strong className="text-slate-900">{formatFCFA(bilan.chiffreAffairesCouture)}</strong>
            </div>

            <div className="flex justify-between py-2">
              <span className="text-slate-600 font-medium">CA Fournitures & Tissus facturés :</span>
              <strong className="text-slate-900">{formatFCFA(bilan.chiffreAffairesMateriaux)}</strong>
            </div>

            <div className="flex justify-between py-2">
              <span className="text-slate-600 font-medium">Reste à encaisser sur commandes livrées :</span>
              <strong className="text-rose-600">{formatFCFA(bilan.resteAEncaisser)}</strong>
            </div>

            <div className="flex justify-between py-2">
              <span className="text-slate-600 font-medium">Commandes livrées sur la période :</span>
              <strong className="text-slate-900">{bilan.nombreCommandesLivrees} commande(s)</strong>
            </div>
          </div>
        </div>

        {/* Financial Consistency Check (Audit Anti-Fraude) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4 text-xs">
          <div className="flex items-center space-x-2 border-b pb-3">
            <ShieldCheck className="w-5 h-5 text-amber-600" />
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Contrôle de Cohérence Argent / Travail
            </h2>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-slate-600">Valeur totale du travail livré :</span>
              <strong className="text-slate-900">{formatFCFA(totalFactureLivre)}</strong>
            </div>

            <div className="flex justify-between">
              <span className="text-slate-600">Encaissements réels en caisse :</span>
              <strong className="text-emerald-700 font-bold">{formatFCFA(totalEncaisse)}</strong>
            </div>

            <div className="flex justify-between border-t pt-2">
              <span className="text-slate-600 font-semibold">Écart de trésorerie :</span>
              <strong className={ecart >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                {ecart > 0 ? '+' : ''}
                {formatFCFA(ecart)}
              </strong>
            </div>

            <div
              className={`p-3 rounded-xl border flex items-start space-x-2 mt-2 ${
                coherenceOk
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-rose-50 border-rose-200 text-rose-900'
              }`}
            >
              {coherenceOk ? (
                <>
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <p className="text-[11px] leading-relaxed">
                    <strong>Cohérence financière validée :</strong> les encaissements enregistrés correspondent de façon
                    étanche à la valeur du travail produit par l'atelier sur cette période (tolérance respectée).
                  </p>
                </>
              ) : (
                <>
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <p className="text-[11px] leading-relaxed">
                    <strong>Attention (Écart &gt; 15%) :</strong> Écart significatif entre les pièces terminées et les
                    paiements réels. Vérifiez les commandes livrées sans paiement complet ou les retards d'encaissement.
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
