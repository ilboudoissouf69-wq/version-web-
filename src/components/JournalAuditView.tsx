import React, { useState } from 'react';
import { ShieldCheck, Lock, Search, Filter, AlertTriangle, CheckCircle, Hash } from 'lucide-react';
import { Employe } from '../types';
import { db } from '../services/storage';

interface Props {
  currentUser: Employe;
}

export const JournalAuditView: React.FC<Props> = ({ currentUser }) => {
  const [recherche, setRecherche] = useState('');
  const [filtreAction, setFiltreAction] = useState('Tous');

  const logs = db.getAuditLogs();

  const logsFiltres = logs.filter(l => {
    if (filtreAction !== 'Tous' && !l.typeAction.includes(filtreAction)) return false;
    if (recherche) {
      const q = recherche.toLowerCase();
      const match =
        l.typeAction.toLowerCase().includes(q) ||
        l.nomOperateur.toLowerCase().includes(q) ||
        (l.motif && l.motif.toLowerCase().includes(q));
      if (!match) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 flex items-center space-x-2">
            <ShieldCheck className="w-6 h-6 text-amber-600" />
            <span>Journal d'Audit Immuable</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Chaîne de hashage SHA-256 • Traçabilité inaltérable des annulations, livraisons forcées et flux sensibles
          </p>
        </div>

        <div className="inline-flex items-center space-x-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          <span>Chaîne d'Intégrité Active</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={recherche}
            onChange={e => setRecherche(e.target.value)}
            placeholder="Rechercher par action, motif ou opérateur..."
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-hidden"
          />
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <span className="font-semibold text-slate-600">Action :</span>
          <select
            value={filtreAction}
            onChange={e => setFiltreAction(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg outline-hidden font-medium"
          >
            <option value="Tous">Toutes les actions</option>
            <option value="ANNULE">Annulations (Paiements / Dépenses)</option>
            <option value="SUPPRIME">Suppressions de commandes</option>
            <option value="LIVRAISON_NON_SOLDEE">Livraisons forcées non soldées</option>
            <option value="CREEE">Créations</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Date & Heure UTC</th>
                <th className="py-3 px-4">Opérateur</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Entité Affectée</th>
                <th className="py-3 px-4">Motif Saisi</th>
                <th className="py-3 px-4 font-mono">Empreinte SHA-256</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logsFiltres.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 italic">
                    Aucune entrée dans le journal d'audit.
                  </td>
                </tr>
              ) : (
                logsFiltres.map(log => {
                  const isAnnul = log.typeAction.includes('ANNULE') || log.typeAction.includes('SUPPRIME');
                  const isForce = log.typeAction.includes('NON_SOLDEE');

                  return (
                    <tr key={log.idJournal} className="hover:bg-amber-50/20 transition-colors">
                      <td className="py-3 px-4 text-slate-600 font-medium">
                        {new Date(log.dateHeureUtc).toLocaleString('fr-FR')}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{log.nomOperateur}</div>
                        <span className="text-[10px] text-slate-400">Rôle : {log.roleOperateur}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded font-bold text-[10px] uppercase border ${
                            isAnnul
                              ? 'bg-rose-100 text-rose-800 border-rose-300'
                              : isForce
                              ? 'bg-amber-100 text-amber-900 border-amber-300'
                              : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          }`}
                        >
                          {log.typeAction}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-800 font-semibold">
                        {log.entite} #{log.idEntite}
                      </td>
                      <td className="py-3 px-4 text-slate-700 max-w-xs">{log.motif || '—'}</td>
                      <td className="py-3 px-4 font-mono text-[10px] text-slate-400 max-w-[140px] truncate" title={log.hashCourant}>
                        {log.hashCourant}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
