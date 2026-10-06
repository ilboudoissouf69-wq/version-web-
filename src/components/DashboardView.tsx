import React from 'react';
import {
  TrendingUp,
  ShoppingBag,
  AlertTriangle,
  Wallet,
  Clock,
  ArrowRight,
  MessageCircle,
  FileText,
  UserCheck,
} from 'lucide-react';
import { Commande, Employe } from '../types';
import { db, formatFCFA } from '../services/storage';
import { genererLienWhatsApp, genererMessageCommandePrete } from '../services/whatsapp';

interface Props {
  currentUser: Employe;
  onNavigate: (view: string) => void;
  onSelectCommande: (cmd: Commande) => void;
}

export const DashboardView: React.FC<Props> = ({ currentUser, onNavigate, onSelectCommande }) => {
  const commandes = db.getCommandes().filter(c => !c.estSupprimee);
  const paiements = db.getPaiements().filter(p => !p.estAnnule);
  const depenses = db.getDepenses().filter(d => !d.estAnnulee && d.statutValidation === 'Validee');
  const couturiers = db.getEmployes().filter(e => e.role === 'Couturier' && e.statut === 'Actif');

  // Today & Month calculations
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];

  const totalEncaisseMois = paiements
    .filter(p => p.datePaiement.split('T')[0] >= firstDayOfMonth)
    .reduce((s, p) => s + p.montantPaye, 0);

  const totalDepensesMois = depenses
    .filter(d => d.dateDepense >= firstDayOfMonth)
    .reduce((s, d) => s + d.montant, 0);

  const commandesEnCours = commandes.filter(
    c => c.pieces.some(p => p.statut === 'A faire' || p.statut === 'En cours')
  );

  const commandesEnRetard = commandes.filter(
    c => c.dateFin < todayStr && c.pieces.some(p => p.statut !== 'Livree' && p.statut !== 'Terminee')
  );

  const commandesUrgentes = commandes
    .filter(c => c.pieces.some(p => p.statut !== 'Livree'))
    .sort((a, b) => a.dateFin.localeCompare(b.dateFin))
    .slice(0, 5);

  // Couturier pieces workload
  const workload = couturiers.map(c => {
    let piecesEnCours = 0;
    let piecesTerminees = 0;
    commandes.forEach(cmd => {
      cmd.pieces.forEach(p => {
        if (p.idCouturier === c.idEmploye) {
          if (p.statut === 'A faire' || p.statut === 'En cours') piecesEnCours++;
          if (p.statut === 'Terminee') piecesTerminees++;
        }
      });
    });
    return {
      couturier: c,
      piecesEnCours,
      piecesTerminees,
      total: piecesEnCours + piecesTerminees,
    };
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-amber-950 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="px-2.5 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full text-xs font-semibold uppercase tracking-wider">
            Rôle : {currentUser.role}
          </span>
          <h1 className="text-2xl font-black tracking-tight mt-2">
            Bonjour, {currentUser.prenom} {currentUser.nom} 👋
          </h1>
          <p className="text-slate-300 text-xs mt-1">
            Atelier de Couture Ilboudo — Retouche Choco • Vue opérationnelle en temps réel
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onNavigate('commandes')}
            className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs transition-colors flex items-center space-x-1.5 shadow-md shadow-amber-500/20 cursor-pointer"
          >
            <span>Nouvelle Commande</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Encaissé ce mois</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{formatFCFA(totalEncaisseMois)}</p>
          <span className="text-[11px] text-slate-400 mt-1 block">Paiements validés (Mois en cours)</span>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Commandes en atelier</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{commandesEnCours.length}</p>
          <span className="text-[11px] text-blue-600 font-medium mt-1 block">À faire ou en cours de confection</span>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Retards livraison</span>
            <div className={`p-2 rounded-lg ${commandesEnRetard.length > 0 ? 'bg-rose-50 text-rose-600' : 'bg-slate-100 text-slate-400'}`}>
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <p className={`text-2xl font-black mt-2 ${commandesEnRetard.length > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
            {commandesEnRetard.length}
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">Date de livraison dépassée</span>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Dépenses ce mois</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{formatFCFA(totalDepensesMois)}</p>
          <span className="text-[11px] text-slate-400 mt-1 block">Charges & fournitures validées</span>
        </div>
      </div>

      {/* Grid: Urgences & Workload */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Urgent Deadlines */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-xs p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-amber-600" />
              <h2 className="font-bold text-slate-900 text-sm">Prochaines Échéances de Livraison</h2>
            </div>
            <button
              onClick={() => onNavigate('alertes')}
              className="text-xs text-amber-600 hover:text-amber-700 font-semibold cursor-pointer"
            >
              Voir toutes les alertes →
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {commandesUrgentes.length === 0 ? (
              <p className="text-slate-400 text-xs italic py-4">Aucune commande en cours.</p>
            ) : (
              commandesUrgentes.map(cmd => {
                const isLate = cmd.dateFin < todayStr;
                const isToday = cmd.dateFin === todayStr;
                const totalCouture = cmd.pieces.reduce((s, p) => s + p.montantCouture, 0);
                const totalMat = (cmd.materielSupplements || []).reduce((s, m) => s + m.montant, 0);
                const paye = (cmd.paiements || []).filter(p => !p.estAnnule).reduce((s, p) => s + p.montantPaye, 0);
                const reste = totalCouture + totalMat - paye;
                const isReady = cmd.pieces.every(p => p.statut === 'Terminee');

                return (
                  <div
                    key={cmd.idCommande}
                    className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/80 px-2 rounded-lg transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-slate-900">CMD #{cmd.idCommande}</span>
                        <span className="text-xs font-medium text-slate-700">
                          {cmd.client ? `${cmd.client.prenom} ${cmd.client.nom}` : 'Client'}
                        </span>
                        {isLate ? (
                          <span className="px-2 py-0.5 bg-rose-100 text-rose-700 font-bold text-[10px] rounded uppercase">
                            En retard
                          </span>
                        ) : isToday ? (
                          <span className="px-2 py-0.5 bg-amber-100 text-amber-800 font-bold text-[10px] rounded uppercase">
                            Aujourd'hui
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400 font-medium">
                            {new Date(cmd.dateFin).toLocaleDateString('fr-FR')}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500">
                        {cmd.pieces.map(p => `${p.typeVetement} (${p.statut})`).join(', ')}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 self-end sm:self-center">
                      {isReady && cmd.client?.telephone && (
                        <a
                          href={genererLienWhatsApp(cmd.client.telephone, genererMessageCommandePrete(cmd))}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg flex items-center space-x-1 cursor-pointer transition-colors"
                          title="Notifier par WhatsApp que la commande est prête"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>WhatsApp</span>
                        </a>
                      )}
                      <button
                        onClick={() => onSelectCommande(cmd)}
                        className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                        title="Ouvrir détails"
                      >
                        <FileText className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Tailors Workload */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <UserCheck className="w-5 h-5 text-amber-600" />
              <h2 className="font-bold text-slate-900 text-sm">Charge des Couturiers</h2>
            </div>
            <button
              onClick={() => onNavigate('statut')}
              className="text-xs text-amber-600 hover:text-amber-700 font-semibold cursor-pointer"
            >
              Atelier →
            </button>
          </div>

          <div className="space-y-3">
            {workload.map(item => (
              <div key={item.couturier.idEmploye} className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div className="flex justify-between items-center text-xs font-semibold mb-1.5">
                  <span className="text-slate-900">{item.couturier.prenom} {item.couturier.nom}</span>
                  <span className="text-slate-500 font-normal">{item.total} pièce(s)</span>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden flex">
                  <div
                    className="bg-amber-500 h-full transition-all"
                    style={{ width: `${item.total > 0 ? (item.piecesEnCours / (item.total || 1)) * 100 : 0}%` }}
                    title={`${item.piecesEnCours} en cours`}
                  />
                  <div
                    className="bg-emerald-500 h-full transition-all"
                    style={{ width: `${item.total > 0 ? (item.piecesTerminees / (item.total || 1)) * 100 : 0}%` }}
                    title={`${item.piecesTerminees} terminées`}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                  <span>En cours : {item.piecesEnCours}</span>
                  <span>Prêtes : {item.piecesTerminees}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
