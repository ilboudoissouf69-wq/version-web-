import React from 'react';
import {
  Bell,
  Clock,
  AlertTriangle,
  MessageCircle,
  Calendar,
  CheckCircle,
  Phone,
  ArrowRight,
} from 'lucide-react';
import { Commande } from '../types';
import { db } from '../services/storage';
import { genererLienWhatsApp, genererMessageRappelRdv, genererMessageCommandePrete } from '../services/whatsapp';

interface Props {
  onSelectCommande: (cmd: Commande) => void;
}

export const AlertesView: React.FC<Props> = ({ onSelectCommande }) => {
  const params = db.getParametres();
  const commandes = db.getCommandes().filter(c => !c.estSupprimee);
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  const alertLimitDate = new Date(now.getTime() + params.delaiAlerteJours * 86400000)
    .toISOString()
    .split('T')[0];

  // Delayed orders
  const commandesRetard = commandes.filter(
    c => c.dateFin < todayStr && c.pieces.some(p => p.statut !== 'Livree')
  );

  // Today's orders
  const commandesAujourdhui = commandes.filter(
    c => c.dateFin === todayStr && c.pieces.some(p => p.statut !== 'Livree')
  );

  // Approaching orders (within alert window)
  const commandesImminentes = commandes.filter(
    c => c.dateFin > todayStr && c.dateFin <= alertLimitDate && c.pieces.some(p => p.statut !== 'Livree')
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div>
        <h1 className="text-xl font-black text-slate-900 flex items-center space-x-2">
          <Bell className="w-6 h-6 text-amber-600" />
          <span>Alertes RDV & Échéances de Livraison</span>
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Surveillance automatique des délais • Relances clients WhatsApp en 1 clic
        </p>
      </div>

      {/* Delayed Orders Section */}
      <div className="bg-white rounded-2xl border border-rose-200 shadow-xs overflow-hidden">
        <div className="bg-rose-50 px-5 py-3 border-b border-rose-200 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-rose-800 font-bold text-xs uppercase tracking-wider">
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            <span>Commandes en Retard ({commandesRetard.length})</span>
          </div>
          <span className="text-[11px] text-rose-700 font-medium">Priorité Haute</span>
        </div>

        <div className="p-4 divide-y divide-slate-100">
          {commandesRetard.length === 0 ? (
            <p className="text-xs text-slate-400 italic py-3 text-center">
              Bravo ! Aucun retard de livraison en ce moment.
            </p>
          ) : (
            commandesRetard.map(cmd => (
              <div key={cmd.idCommande} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-black text-slate-900 text-xs">CMD #{cmd.idCommande}</span>
                    <strong className="text-slate-800 text-xs">
                      {cmd.client ? `${cmd.client.prenom} ${cmd.client.nom}` : 'Client'}
                    </strong>
                    <span className="px-2 py-0.5 bg-rose-100 text-rose-800 font-bold text-[10px] rounded">
                      Échue le {new Date(cmd.dateFin).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Pièces : {cmd.pieces.map(p => `${p.typeVetement} (${p.couturierNom || 'Atelier'} - ${p.statut})`).join(', ')}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {cmd.client?.telephone && (
                    <a
                      href={genererLienWhatsApp(cmd.client.telephone, genererMessageRappelRdv(cmd))}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center space-x-1 cursor-pointer transition-colors"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>Informer Client</span>
                    </a>
                  )}
                  <button
                    onClick={() => onSelectCommande(cmd)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
                  >
                    Détails
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Today's Due Orders */}
      <div className="bg-white rounded-2xl border border-amber-200 shadow-xs overflow-hidden">
        <div className="bg-amber-50 px-5 py-3 border-b border-amber-200 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-amber-900 font-bold text-xs uppercase tracking-wider">
            <Clock className="w-4 h-4 text-amber-600" />
            <span>Livraisons Prévues Aujourd'hui ({commandesAujourdhui.length})</span>
          </div>
          <span className="text-[11px] text-amber-700 font-medium">À finaliser aujourd'hui</span>
        </div>

        <div className="p-4 divide-y divide-slate-100">
          {commandesAujourdhui.length === 0 ? (
            <p className="text-xs text-slate-400 italic py-3 text-center">Aucune livraison prévue aujourd'hui.</p>
          ) : (
            commandesAujourdhui.map(cmd => {
              const allReady = cmd.pieces.every(p => p.statut === 'Terminee');
              return (
                <div key={cmd.idCommande} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-black text-slate-900 text-xs">CMD #{cmd.idCommande}</span>
                      <strong className="text-slate-800 text-xs">
                        {cmd.client ? `${cmd.client.prenom} ${cmd.client.nom}` : 'Client'}
                      </strong>
                      <span className="text-xs text-slate-500">Heure : {cmd.heureDebut || '10:00'}</span>
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {cmd.pieces.map(p => `${p.typeVetement} [${p.statut}]`).join(' • ')}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {cmd.client?.telephone && (
                      <a
                        href={genererLienWhatsApp(
                          cmd.client.telephone,
                          allReady ? genererMessageCommandePrete(cmd) : genererMessageRappelRdv(cmd)
                        )}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center space-x-1 cursor-pointer transition-colors"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>{allReady ? 'Commande Prête' : 'Rappel RDV'}</span>
                      </a>
                    )}
                    <button
                      onClick={() => onSelectCommande(cmd)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
                    >
                      Détails
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Upcoming Within Window */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="bg-slate-50 px-5 py-3 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-slate-700 font-bold text-xs uppercase tracking-wider">
            <Calendar className="w-4 h-4 text-slate-500" />
            <span>À venir sous {params.delaiAlerteJours} jours ({commandesImminentes.length})</span>
          </div>
        </div>

        <div className="p-4 divide-y divide-slate-100">
          {commandesImminentes.length === 0 ? (
            <p className="text-xs text-slate-400 italic py-3 text-center">Aucune commande imminente.</p>
          ) : (
            commandesImminentes.map(cmd => (
              <div key={cmd.idCommande} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-900 text-xs">CMD #{cmd.idCommande}</span>
                    <span className="text-slate-800 font-medium text-xs">
                      {cmd.client ? `${cmd.client.prenom} ${cmd.client.nom}` : 'Client'}
                    </span>
                    <span className="text-xs text-slate-400">
                      Livraison le {new Date(cmd.dateFin).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {cmd.pieces.map(p => `${p.typeVetement} (${p.couturierNom || 'Atelier'})`).join(', ')}
                  </div>
                </div>

                <button
                  onClick={() => onSelectCommande(cmd)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer self-end sm:self-center"
                >
                  Voir Commande
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
