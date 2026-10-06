import React, { useState } from 'react';
import {
  Users,
  Search,
  UserPlus,
  Phone,
  MessageCircle,
  FileText,
  Calendar,
  Trash2,
  Edit,
  X,
  Check,
  AlertCircle,
} from 'lucide-react';
import { Client, Commande } from '../types';
import { db, normaliserTexte } from '../services/storage';
import { genererLienWhatsApp } from '../services/whatsapp';

interface Props {
  onSelectCommande: (cmd: Commande) => void;
  onNavigateToCommandesForClient: (clientId: number) => void;
}

export const ClientsView: React.FC<Props> = ({ onSelectCommande, onNavigateToCommandesForClient }) => {
  const [recherche, setRecherche] = useState('');
  const [modalClientOuvert, setModalClientOuvert] = useState(false);
  const [clientEnEdition, setClientEnEdition] = useState<Partial<Client> | null>(null);
  const [clientSelectionne, setClientSelectionne] = useState<Client | null>(null);
  const [erreur, setErreur] = useState('');

  const clients = db.getClients();
  const commandes = db.getCommandes().filter(c => !c.estSupprimee);

  const clientsFiltres = clients.filter(c => {
    const q = normaliserTexte(recherche);
    if (!q) return true;
    const nomComplet = normaliserTexte(`${c.prenom} ${c.nom}`);
    const tel = c.telephone.replace(/\s+/g, '');
    return nomComplet.includes(q) || tel.includes(q.replace(/\s+/g, ''));
  });

  const handleOuvrirNouveau = () => {
    setClientEnEdition({ nom: '', prenom: '', telephone: '' });
    setErreur('');
    setModalClientOuvert(true);
  };

  const handleOuvrirEdition = (c: Client, e: React.MouseEvent) => {
    e.stopPropagation();
    setClientEnEdition(c);
    setErreur('');
    setModalClientOuvert(true);
  };

  const handleSauvegarder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientEnEdition) return;
    try {
      db.saveClient(clientEnEdition);
      setModalClientOuvert(false);
      setClientEnEdition(null);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErreur(err.message);
      }
    }
  };

  const handleSupprimer = (idClient: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce client ?')) {
      try {
        db.deleteClient(idClient);
        if (clientSelectionne?.idClient === idClient) {
          setClientSelectionne(null);
        }
      } catch (err: unknown) {
        if (err instanceof Error) {
          alert(err.message);
        }
      }
    }
  };

  const commandesDuClient = clientSelectionne
    ? commandes.filter(c => c.idClient === clientSelectionne.idClient)
    : [];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 flex items-center space-x-2">
            <Users className="w-6 h-6 text-amber-600" />
            <span>Répertoire des Clients</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {clients.length} client(s) enregistrés • Fiches de mesures et historique de commandes
          </p>
        </div>
        <button
          onClick={handleOuvrirNouveau}
          className="inline-flex items-center space-x-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-md shadow-amber-600/20"
        >
          <UserPlus className="w-4 h-4" />
          <span>Nouveau Client</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
        <input
          type="text"
          value={recherche}
          onChange={e => setRecherche(e.target.value)}
          placeholder="Rechercher par nom, prénom ou téléphone (insensible aux accents)..."
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-hidden shadow-xs"
        />
      </div>

      {/* Main Grid: List and Detail Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Clients Table */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Client</th>
                  <th className="py-3 px-4">Téléphone</th>
                  <th className="py-3 px-4 text-center">Commandes</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {clientsFiltres.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-400 italic">
                      Aucun client trouvé pour "{recherche}".
                    </td>
                  </tr>
                ) : (
                  clientsFiltres.map(client => {
                    const nbCmds = commandes.filter(c => c.idClient === client.idClient).length;
                    const isSelected = clientSelectionne?.idClient === client.idClient;
                    return (
                      <tr
                        key={client.idClient}
                        onClick={() => setClientSelectionne(client)}
                        className={`hover:bg-amber-50/50 cursor-pointer transition-colors ${
                          isSelected ? 'bg-amber-50/80 font-medium' : ''
                        }`}
                      >
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">
                            {client.prenom} {client.nom}
                          </div>
                          <span className="text-[10px] text-slate-400">Inscrit le {client.dateCreation}</span>
                        </td>
                        <td className="py-3 px-4 text-slate-600 font-medium">
                          {client.telephone ? (
                            <div className="flex items-center space-x-1.5">
                              <Phone className="w-3.5 h-3.5 text-slate-400" />
                              <span>{client.telephone}</span>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">—</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-700 font-bold rounded-full text-[11px]">
                            {nbCmds}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end space-x-1.5">
                            {client.telephone && (
                              <a
                                href={genererLienWhatsApp(client.telephone, `Bonjour ${client.prenom} ${client.nom},`)}
                                target="_blank"
                                rel="noreferrer"
                                onClick={e => e.stopPropagation()}
                                className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                                title="Ouvrir WhatsApp"
                              >
                                <MessageCircle className="w-4 h-4" />
                              </a>
                            )}
                            <button
                              onClick={e => handleOuvrirEdition(client, e)}
                              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                              title="Modifier"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={e => handleSupprimer(client.idClient, e)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Supprimer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
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

        {/* Client Detail Sidebar Panel */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-5">
          {clientSelectionne ? (
            <>
              <div className="border-b border-slate-200 pb-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-base font-black text-slate-900">
                      {clientSelectionne.prenom} {clientSelectionne.nom}
                    </h2>
                    <p className="text-xs text-slate-500">Client #{clientSelectionne.idClient}</p>
                  </div>
                  {clientSelectionne.telephone && (
                    <a
                      href={genererLienWhatsApp(clientSelectionne.telephone, `Bonjour ${clientSelectionne.prenom} ${clientSelectionne.nom},`)}
                      target="_blank"
                      rel="noreferrer"
                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg flex items-center space-x-1 cursor-pointer transition-colors"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>WhatsApp</span>
                    </a>
                  )}
                </div>
                <div className="mt-3 flex items-center text-xs text-slate-600 space-x-2">
                  <Phone className="w-4 h-4 text-slate-400" />
                  <span>{clientSelectionne.telephone || 'Aucun numéro renseigné'}</span>
                </div>
              </div>

              {/* Order history */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Historique ({commandesDuClient.length})
                  </h3>
                  <button
                    onClick={() => onNavigateToCommandesForClient(clientSelectionne.idClient)}
                    className="text-[11px] font-semibold text-amber-600 hover:text-amber-700 cursor-pointer"
                  >
                    + Nouvelle commande
                  </button>
                </div>

                <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                  {commandesDuClient.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">Aucune commande pour ce client.</p>
                  ) : (
                    commandesDuClient.map(cmd => (
                      <div
                        key={cmd.idCommande}
                        onClick={() => onSelectCommande(cmd)}
                        className="p-2.5 bg-slate-50 hover:bg-amber-50/60 rounded-lg border border-slate-200 text-xs cursor-pointer transition-colors"
                      >
                        <div className="flex justify-between items-center font-bold text-slate-900">
                          <span>CMD #{cmd.idCommande}</span>
                          <span className="text-[11px] font-normal text-slate-500">
                            {new Date(cmd.dateDebut).toLocaleDateString('fr-FR')}
                          </span>
                        </div>
                        <div className="text-slate-600 text-[11px] mt-1">
                          {cmd.pieces.map(p => p.typeVetement).join(' + ')}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Latest measurements snapshot */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Dernières Mesures Prises
                </h3>
                {commandesDuClient.length > 0 &&
                commandesDuClient[0].pieces.some(p => p.mesures && p.mesures.length > 0) ? (
                  <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-50 p-3 rounded-lg border border-slate-200">
                    {commandesDuClient[0].pieces
                      .flatMap(p => p.mesures || [])
                      .slice(0, 6)
                      .map((m, idx) => (
                        <div key={idx} className="flex justify-between">
                          <span className="text-slate-500">{m.nomMesure}:</span>
                          <strong className="text-slate-900">{m.valeur} cm</strong>
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">Aucune mesure archivée.</p>
                )}
              </div>
            </>
          ) : (
            <div className="py-12 text-center text-slate-400">
              <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-xs font-medium">Sélectionnez un client pour voir sa fiche détaillée.</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal Add/Edit Client */}
      {modalClientOuvert && clientEnEdition && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
              <h3 className="font-semibold text-sm">
                {clientEnEdition.idClient ? 'Modifier le Client' : 'Ajouter un Nouveau Client'}
              </h3>
              <button
                onClick={() => setModalClientOuvert(false)}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSauvegarder} className="p-6 space-y-4">
              {erreur && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{erreur}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Prénom *</label>
                <input
                  type="text"
                  value={clientEnEdition.prenom || ''}
                  onChange={e => setClientEnEdition({ ...clientEnEdition, prenom: e.target.value })}
                  placeholder="ex: Rasmata"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-hidden"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nom de famille *</label>
                <input
                  type="text"
                  value={clientEnEdition.nom || ''}
                  onChange={e => setClientEnEdition({ ...clientEnEdition, nom: e.target.value })}
                  placeholder="ex: Kaboré"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-hidden"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Téléphone (WhatsApp)</label>
                <input
                  type="text"
                  value={clientEnEdition.telephone || ''}
                  onChange={e => setClientEnEdition({ ...clientEnEdition, telephone: e.target.value })}
                  placeholder="ex: 70 12 34 56"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-hidden"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Permet l'envoi direct de notifications WhatsApp lors de la fin de confection.
                </span>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalClientOuvert(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-xs"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
