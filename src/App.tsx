import React, { useState, useEffect } from 'react';
import { db } from './services/storage';
import { Employe, Commande, PieceCommande, Paiement } from './types';
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { ClientsView } from './components/ClientsView';
import { CommandesView } from './components/CommandesView';
import { PaiementsView } from './components/PaiementsView';
import { StatutView } from './components/StatutView';
import { CommissionsView } from './components/CommissionsView';
import { DepensesView } from './components/DepensesView';
import { TresorerieView } from './components/TresorerieView';
import { AlertesView } from './components/AlertesView';
import { RetoursView } from './components/RetoursView';
import { TypesVetementsView } from './components/TypesVetementsView';
import { EmployesView } from './components/EmployesView';
import { JournalAuditView } from './components/JournalAuditView';
import { ParametresView } from './components/ParametresView';
import { LoginModal } from './components/LoginModal';
import { ChangePasswordModal } from './components/ChangePasswordModal';
import { FenetreRecuModal } from './components/FenetreRecuModal';
import { FicheAtelierModal } from './components/FicheAtelierModal';

export default function App() {
  const [currentUser, setCurrentUser] = useState<Employe | null>(() => db.getCurrentUser());
  const [currentView, setCurrentView] = useState<string>('dashboard');

  // Modals state
  const [modalLoginOuvert, setModalLoginOuvert] = useState<boolean>(!currentUser);
  const [modalChangerMdpOuvert, setModalChangerMdpOuvert] = useState<boolean>(false);
  const [modalRecuCommande, setModalRecuCommande] = useState<{ cmd: Commande; paiement?: Paiement } | null>(null);
  const [modalFicheAtelier, setModalFicheAtelier] = useState<{ cmd: Commande; piece?: PieceCommande } | null>(null);

  // Cross-view navigation state
  const [initialClientIdForCommande, setInitialClientIdForCommande] = useState<number | undefined>();

  useEffect(() => {
    if (!currentUser) {
      setModalLoginOuvert(true);
    } else {
      setModalLoginOuvert(false);
      if (currentUser.role === 'Couturier') {
        setCurrentView('statut');
      }
    }
  }, [currentUser]);

  const handleLogout = () => {
    db.setCurrentUser(null);
    setCurrentUser(null);
    setModalLoginOuvert(true);
  };

  const handleLoginSuccess = (user: Employe) => {
    setCurrentUser(user);
    setModalLoginOuvert(false);
    if (user.role === 'Couturier') {
      setCurrentView('statut');
    } else {
      setCurrentView('dashboard');
    }
  };

  const handleSelectCommandeDetails = (cmd: Commande) => {
    // Open receipt or workshop ticket
    setModalRecuCommande({ cmd });
  };

  const handleNavigateToCommandesForClient = (clientId: number) => {
    setInitialClientIdForCommande(clientId);
    setCurrentView('commandes');
  };

  if (!currentUser) {
    return <LoginModal onSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 font-sans antialiased text-slate-900">
      {/* Sidebar Navigation */}
      <Sidebar
        currentView={currentView}
        onNavigate={view => {
          setInitialClientIdForCommande(undefined);
          setCurrentView(view);
        }}
        currentUser={currentUser}
        onLogout={handleLogout}
        onChangePassword={() => setModalChangerMdpOuvert(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-slate-50/50">
        <div className="max-w-7xl mx-auto">
          {currentView === 'dashboard' && (
            <DashboardView
              currentUser={currentUser}
              onNavigate={setCurrentView}
              onSelectCommande={handleSelectCommandeDetails}
            />
          )}

          {currentView === 'clients' && (
            <ClientsView
              onSelectCommande={handleSelectCommandeDetails}
              onNavigateToCommandesForClient={handleNavigateToCommandesForClient}
            />
          )}

          {currentView === 'commandes' && (
            <CommandesView
              currentUser={currentUser}
              initialClientId={initialClientIdForCommande}
              onOpenRecu={cmd => setModalRecuCommande({ cmd })}
              onOpenFicheAtelier={(cmd, piece) => setModalFicheAtelier({ cmd, piece })}
              onOpenPaiementModal={cmd => {
                setCurrentView('paiements');
              }}
            />
          )}

          {currentView === 'paiements' && (
            <PaiementsView
              currentUser={currentUser}
              onOpenRecuForPaiement={(cmd, p) => setModalRecuCommande({ cmd, paiement: p })}
            />
          )}

          {currentView === 'statut' && (
            <StatutView
              currentUser={currentUser}
              onOpenFicheAtelier={(cmd, piece) => setModalFicheAtelier({ cmd, piece })}
              onSelectCommande={handleSelectCommandeDetails}
            />
          )}

          {currentView === 'alertes' && (
            <AlertesView onSelectCommande={handleSelectCommandeDetails} />
          )}

          {currentView === 'retours' && (
            <RetoursView currentUser={currentUser} />
          )}

          {currentView === 'depenses' && (
            <DepensesView currentUser={currentUser} />
          )}

          {currentView === 'commissions' && (
            <CommissionsView currentUser={currentUser} />
          )}

          {currentView === 'tresorerie' && (
            <TresorerieView currentUser={currentUser} />
          )}

          {currentView === 'types_vetements' && (
            <TypesVetementsView currentUser={currentUser} />
          )}

          {currentView === 'employes' && (
            <EmployesView currentUser={currentUser} />
          )}

          {currentView === 'audit' && (
            <JournalAuditView currentUser={currentUser} />
          )}

          {currentView === 'parametres' && (
            <ParametresView currentUser={currentUser} />
          )}
        </div>
      </main>

      {/* Global Modals */}
      {modalChangerMdpOuvert && (
        <ChangePasswordModal
          user={currentUser}
          onClose={() => setModalChangerMdpOuvert(false)}
          onSuccess={() => setModalChangerMdpOuvert(false)}
        />
      )}

      {modalRecuCommande && (
        <FenetreRecuModal
          commande={modalRecuCommande.cmd}
          paiement={modalRecuCommande.paiement}
          onClose={() => setModalRecuCommande(null)}
        />
      )}

      {modalFicheAtelier && (
        <FicheAtelierModal
          commande={modalFicheAtelier.cmd}
          piece={modalFicheAtelier.piece}
          onClose={() => setModalFicheAtelier(null)}
        />
      )}
    </div>
  );
}
