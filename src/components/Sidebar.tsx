import React from 'react';
import {
  LayoutDashboard,
  Users,
  ShoppingBag,
  CreditCard,
  Layers,
  Award,
  Receipt,
  TrendingUp,
  Bell,
  RotateCcw,
  Tag,
  UserCheck,
  ShieldCheck,
  Settings,
  LogOut,
  KeyRound,
  Scissors,
} from 'lucide-react';
import { Employe } from '../types';
import { db } from '../services/storage';

interface Props {
  currentView: string;
  onNavigate: (view: string) => void;
  currentUser: Employe;
  onLogout: () => void;
  onChangePassword: () => void;
}

export const Sidebar: React.FC<Props> = ({
  currentView,
  onNavigate,
  currentUser,
  onLogout,
  onChangePassword,
}) => {
  const isBoss = currentUser.role === 'Boss';
  const isSecretaire = currentUser.role === 'Secretaire';
  const isCouturier = currentUser.role === 'Couturier';

  // Count active alerts (delayed or urgent)
  const todayStr = new Date().toISOString().split('T')[0];
  const commandes = db.getCommandes().filter(c => !c.estSupprimee);
  const alertCount = commandes.filter(
    c => c.dateFin <= todayStr && c.pieces.some(p => p.statut !== 'Livree')
  ).length;

  interface NavItem {
    id: string;
    label: string;
    icon: React.ElementType;
    badge?: number;
    show: boolean;
  }

  const navItems: NavItem[] = [
    { id: 'dashboard', label: 'Tableau de bord', icon: LayoutDashboard, show: true },
    { id: 'clients', label: 'Clients', icon: Users, show: isBoss || isSecretaire },
    { id: 'commandes', label: 'Commandes', icon: ShoppingBag, show: isBoss || isSecretaire },
    { id: 'paiements', label: 'Paiements', icon: CreditCard, show: isBoss || isSecretaire },
    { id: 'statut', label: isCouturier ? 'Mes Pièces' : 'Statut Atelier', icon: Layers, show: true },
    { id: 'alertes', label: 'Alertes RDV', icon: Bell, badge: alertCount > 0 ? alertCount : undefined, show: isBoss || isSecretaire },
    { id: 'retours', label: 'Retours / Reprises', icon: RotateCcw, show: true },
    { id: 'depenses', label: 'Dépenses', icon: Receipt, show: isBoss || isSecretaire },
    { id: 'commissions', label: 'Commissions', icon: Award, show: isBoss },
    { id: 'tresorerie', label: 'Trésorerie & Bilan', icon: TrendingUp, show: isBoss },
    { id: 'types_vetements', label: 'Types de vêtements', icon: Tag, show: isBoss },
    { id: 'employes', label: 'Employés', icon: UserCheck, show: isBoss },
    { id: 'audit', label: 'Journal d\'Audit', icon: ShieldCheck, show: isBoss },
    { id: 'parametres', label: 'Paramètres', icon: Settings, show: isBoss },
  ];

  return (
    <aside className="w-64 bg-slate-950 text-slate-300 flex flex-col h-screen shrink-0 border-r border-slate-800 select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800/80 flex items-center space-x-3">
        <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
          <Scissors className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-base font-black text-white tracking-wide uppercase">Retouche Choco</h1>
          <p className="text-[11px] text-amber-400/90 font-medium">Gestion Couture Pro</p>
        </div>
      </div>

      {/* User Info Card */}
      <div className="px-4 py-3 mx-3 my-2 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-between">
        <div className="min-w-0 pr-2">
          <p className="text-xs font-bold text-white truncate">
            {currentUser.prenom} {currentUser.nom}
          </p>
          <span
            className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full mt-0.5 ${
              isBoss
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : isSecretaire
                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
            }`}
          >
            {currentUser.role}
          </span>
        </div>
        <button
          onClick={onChangePassword}
          title="Changer de mot de passe"
          className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <KeyRound className="w-4 h-4" />
        </button>
      </div>

      {/* Navigation Links (Scrollable) */}
      <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-1 text-xs font-medium">
        {navItems
          .filter(item => item.show)
          .map(item => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all cursor-pointer ${
                  isActive
                    ? 'bg-amber-600 text-white font-bold shadow-md shadow-amber-600/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <div className="flex items-center space-x-2.5 min-w-0">
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span className="px-1.5 py-0.5 text-[10px] font-black bg-rose-600 text-white rounded-full">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
      </nav>

      {/* Bottom Logout */}
      <div className="p-3 border-t border-slate-800">
        <button
          onClick={onLogout}
          className="w-full flex items-center space-x-2.5 px-3 py-2 text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 rounded-xl transition-colors text-xs font-medium cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Déconnexion</span>
        </button>
      </div>
    </aside>
  );
};
