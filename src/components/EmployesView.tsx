import React, { useState } from 'react';
import { UserCheck, UserPlus, Shield, Lock, Power, Edit, X, AlertCircle } from 'lucide-react';
import { Employe, RoleEmploye } from '../types';
import { db } from '../services/storage';

interface Props {
  currentUser: Employe;
}

export const EmployesView: React.FC<Props> = ({ currentUser }) => {
  const [employes, setEmployes] = useState<Employe[]>(db.getEmployes());
  const [modalOuvert, setModalOuvert] = useState(false);
  const [editionEmploye, setEditionEmploye] = useState<Partial<Employe> | null>(null);
  const [erreur, setErreur] = useState('');

  const reload = () => setEmployes(db.getEmployes());

  const handleOuvrirNouveau = () => {
    setEditionEmploye({
      nom: '',
      prenom: '',
      identifiant: '',
      motDePasse: '123456',
      role: 'Couturier',
      statut: 'Actif',
    });
    setErreur('');
    setModalOuvert(true);
  };

  const handleOuvrirEdition = (e: Employe) => {
    setEditionEmploye({ ...e });
    setErreur('');
    setModalOuvert(true);
  };

  const handleToggleStatut = (emp: Employe) => {
    if (emp.idEmploye === currentUser.idEmploye) {
      alert('Vous ne pouvez pas suspendre votre propre compte connecté.');
      return;
    }
    const nouveauStatut = emp.statut === 'Actif' ? 'Suspendu' : 'Actif';
    db.saveEmploye({ ...emp, statut: nouveauStatut });
    reload();
  };

  const handleSauvegarder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editionEmploye || !editionEmploye.nom?.trim() || !editionEmploye.prenom?.trim()) {
      setErreur('Nom et prénom sont obligatoires.');
      return;
    }
    if (!editionEmploye.identifiant?.trim()) {
      setErreur('L\'identifiant est obligatoire.');
      return;
    }

    try {
      db.saveEmploye(editionEmploye as Employe);
      reload();
      setModalOuvert(false);
      setEditionEmploye(null);
    } catch (err: unknown) {
      if (err instanceof Error) setErreur(err.message);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 flex items-center space-x-2">
            <UserCheck className="w-6 h-6 text-amber-600" />
            <span>Gestion des Employés & Rôles</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Comptes d'accès • Permissions Administrateur, Secrétaire et Couturiers
          </p>
        </div>
        <button
          onClick={handleOuvrirNouveau}
          className="inline-flex items-center space-x-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-md shadow-amber-600/20"
        >
          <UserPlus className="w-4 h-4" />
          <span>Nouvel Employé</span>
        </button>
      </div>

      {/* Staff Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Employé</th>
                <th className="py-3 px-4">Identifiant</th>
                <th className="py-3 px-4">Rôle</th>
                <th className="py-3 px-4 text-center">Statut</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {employes.map(emp => {
                const isCurrent = emp.idEmploye === currentUser.idEmploye;
                return (
                  <tr key={emp.idEmploye} className="hover:bg-amber-50/30 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 flex items-center space-x-1.5">
                        <span>
                          {emp.prenom} {emp.nom}
                        </span>
                        {isCurrent && (
                          <span className="px-1.5 py-0.2 bg-amber-100 text-amber-800 text-[10px] font-bold rounded">
                            Vous
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono font-medium text-slate-700">{emp.identifiant}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full font-bold text-[11px] border ${
                          emp.role === 'Boss'
                            ? 'bg-amber-100 text-amber-800 border-amber-300'
                            : emp.role === 'Secretaire'
                            ? 'bg-blue-100 text-blue-800 border-blue-300'
                            : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                        }`}
                      >
                        {emp.role}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full font-bold text-[10px] uppercase ${
                          emp.statut === 'Actif'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {emp.statut}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          onClick={() => handleOuvrirEdition(emp)}
                          className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg cursor-pointer"
                          title="Modifier"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        {!isCurrent && (
                          <button
                            onClick={() => handleToggleStatut(emp)}
                            className={`p-1.5 rounded-lg cursor-pointer transition-colors ${
                              emp.statut === 'Actif'
                                ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                                : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
                            }`}
                            title={emp.statut === 'Actif' ? 'Suspendre' : 'Activer'}
                          >
                            <Power className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add / Edit */}
      {modalOuvert && editionEmploye && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
              <h3 className="font-bold text-sm">
                {editionEmploye.idEmploye ? 'Modifier le Compte Employé' : 'Ajouter un Nouvel Employé'}
              </h3>
              <button onClick={() => setModalOuvert(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSauvegarder} className="p-6 space-y-4 text-xs">
              {erreur && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{erreur}</span>
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 mb-1">Prénom *</label>
                <input
                  type="text"
                  value={editionEmploye.prenom || ''}
                  onChange={e => setEditionEmploye({ ...editionEmploye, prenom: e.target.value })}
                  placeholder="ex: Moussa"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-hidden font-medium"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nom de famille *</label>
                <input
                  type="text"
                  value={editionEmploye.nom || ''}
                  onChange={e => setEditionEmploye({ ...editionEmploye, nom: e.target.value })}
                  placeholder="ex: Ouedraogo"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-hidden font-medium"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Identifiant de connexion *</label>
                <input
                  type="text"
                  value={editionEmploye.identifiant || ''}
                  onChange={e => setEditionEmploye({ ...editionEmploye, identifiant: e.target.value })}
                  placeholder="ex: couturier005"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-hidden font-mono"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Mot de passe temporaire *</label>
                <input
                  type="text"
                  value={editionEmploye.motDePasse || ''}
                  onChange={e => setEditionEmploye({ ...editionEmploye, motDePasse: e.target.value })}
                  placeholder="Mot de passe"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-hidden font-mono"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Rôle dans l'atelier *</label>
                <select
                  value={editionEmploye.role}
                  onChange={e => setEditionEmploye({ ...editionEmploye, role: e.target.value as RoleEmploye })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-hidden font-bold"
                >
                  <option value="Couturier">Couturier (Accès pièces atelier)</option>
                  <option value="Secretaire">Secrétaire (Commandes, Clients, Paiements)</option>
                  <option value="Boss">Boss / Administrateur (Accès total & Trésorerie)</option>
                </select>
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setModalOuvert(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold cursor-pointer shadow-md shadow-amber-600/20"
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
