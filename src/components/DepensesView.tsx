import React, { useState } from 'react';
import {
  Receipt,
  Plus,
  CheckCircle,
  XCircle,
  Ban,
  Filter,
  DollarSign,
  AlertTriangle,
  X,
  FileCheck,
} from 'lucide-react';
import { Depense, Employe } from '../types';
import { db, formatFCFA, normaliserTexte } from '../services/storage';

interface Props {
  currentUser: Employe;
}

const CATALOGUE_TYPES: Record<string, string[]> = {
  'Charges fixes': ['Loyer', 'Électricité', 'Eau', 'Connexion Internet', 'Téléphone'],
  'Masse salariale': ['Salaire Secrétaire', 'Avance sur salaire', 'Prime exceptionnelle'],
  'Matériel & Entretien': [
    'Fils & Accessoires',
    'Fermetures & Boutons',
    'Aiguilles',
    'Réparation machine',
    'Entretien atelier',
    'Achat fournitures',
  ],
  'Divers': ['Transport', 'Restauration', 'Faux frais', 'Autre'],
};

export const DepensesView: React.FC<Props> = ({ currentUser }) => {
  const isBoss = currentUser.role === 'Boss';
  const [modalOuvert, setModalOuvert] = useState(false);
  const [filtreCategorie, setFiltreCategorie] = useState<string>('Toutes');
  const [erreur, setErreur] = useState('');

  // Form state
  const [categorie, setCategorie] = useState<Depense['categorie']>('Matériel & Entretien');
  const [typeDepense, setTypeDepense] = useState(CATALOGUE_TYPES['Matériel & Entretien'][0]);
  const [montant, setMontant] = useState<number>(0);
  const [dateDepense, setDateDepense] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');

  // Cancel state
  const [depenseAAnnuler, setDepenseAAnnuler] = useState<Depense | null>(null);
  const [motifAnnulation, setMotifAnnulation] = useState('');

  const depenses = db.getDepenses();

  const depensesFiltrees = depenses.filter(d => {
    if (filtreCategorie !== 'Toutes' && d.categorie !== filtreCategorie) return false;
    return true;
  });

  const totalDepenses = depenses
    .filter(d => !d.estAnnulee && d.statutValidation === 'Validee')
    .reduce((s, d) => s + d.montant, 0);

  const totalEnAttente = depenses
    .filter(d => !d.estAnnulee && d.statutValidation === 'En attente')
    .reduce((s, d) => s + d.montant, 0);

  const handleCreerDepense = (e: React.FormEvent) => {
    e.preventDefault();
    setErreur('');
    if (montant <= 0) {
      setErreur('Le montant doit être supérieur à zéro.');
      return;
    }

    try {
      db.saveDepense({
        categorie,
        typeDepense,
        montant: Number(montant),
        dateDepense,
        description,
      });
      setModalOuvert(false);
      setMontant(0);
      setDescription('');
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErreur(err.message);
      }
    }
  };

  const handleValiderDepense = (id: number) => {
    try {
      db.validerDepense(id);
    } catch (err: unknown) {
      if (err instanceof Error) {
        alert(err.message);
      }
    }
  };

  const handleConfirmerAnnulation = () => {
    if (!depenseAAnnuler || !motifAnnulation.trim()) return;
    try {
      db.annulerDepense(depenseAAnnuler.idDepense, motifAnnulation);
      setDepenseAAnnuler(null);
      setMotifAnnulation('');
    } catch (err: unknown) {
      if (err instanceof Error) {
        alert(err.message);
      }
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 flex items-center space-x-2">
            <Receipt className="w-6 h-6 text-amber-600" />
            <span>Gestion des Dépenses de l'Atelier</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Suivi des charges fixes, réparations, fils et salaires • Circuit de validation Boss
          </p>
        </div>
        <button
          onClick={() => {
            setMontant(0);
            setDescription('');
            setErreur('');
            setModalOuvert(true);
          }}
          className="inline-flex items-center space-x-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-md shadow-amber-600/20"
        >
          <Plus className="w-4 h-4" />
          <span>Nouvelle Dépense</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Dépenses Validées Totales
          </span>
          <p className="text-xl font-black text-slate-900 mt-1">{formatFCFA(totalDepenses)}</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            En Attente d'Approbation
          </span>
          <p className="text-xl font-black text-amber-600 mt-1">{formatFCFA(totalEnAttente)}</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Charges fixes & loyer
          </span>
          <p className="text-xl font-black text-slate-800 mt-1">
            {formatFCFA(
              depenses
                .filter(d => !d.estAnnulee && d.categorie === 'Charges fixes' && d.statutValidation === 'Validee')
                .reduce((s, d) => s + d.montant, 0)
            )}
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Fournitures & Réparations
          </span>
          <p className="text-xl font-black text-slate-800 mt-1">
            {formatFCFA(
              depenses
                .filter(d => !d.estAnnulee && d.categorie === 'Matériel & Entretien' && d.statutValidation === 'Validee')
                .reduce((s, d) => s + d.montant, 0)
            )}
          </p>
        </div>
      </div>

      {/* Filter Category Bar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between text-xs">
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="font-semibold text-slate-600">Catégorie :</span>
          <div className="flex flex-wrap gap-1">
            {['Toutes', 'Charges fixes', 'Masse salariale', 'Matériel & Entretien', 'Divers'].map(cat => (
              <button
                key={cat}
                onClick={() => setFiltreCategorie(cat)}
                className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                  filtreCategorie === cat ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Catégorie & Type</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4">Opérateur</th>
                <th className="py-3 px-4 text-right">Montant</th>
                <th className="py-3 px-4 text-center">Statut</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {depensesFiltrees.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 italic">
                    Aucune dépense enregistrée.
                  </td>
                </tr>
              ) : (
                depensesFiltrees.map(d => (
                  <tr
                    key={d.idDepense}
                    className={`hover:bg-amber-50/40 transition-colors ${d.estAnnulee ? 'opacity-50 bg-slate-50' : ''}`}
                  >
                    <td className="py-3 px-4 font-semibold text-slate-800">
                      {new Date(d.dateDepense).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{d.typeDepense}</div>
                      <span className="text-[10px] text-slate-400 font-medium">{d.categorie}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 max-w-xs truncate">{d.description || '—'}</td>
                    <td className="py-3 px-4 text-slate-600">{d.nomOperateur}</td>
                    <td className="py-3 px-4 text-right font-black text-slate-900 text-sm">
                      {formatFCFA(d.montant)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {d.estAnnulee ? (
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-500 font-bold text-[10px] rounded uppercase">
                          Annulée
                        </span>
                      ) : d.statutValidation === 'En attente' ? (
                        <span className="px-2 py-0.5 bg-amber-100 text-amber-800 font-bold text-[10px] rounded uppercase">
                          En attente
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold text-[10px] rounded uppercase">
                          Validée
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1">
                        {!d.estAnnulee && d.statutValidation === 'En attente' && isBoss && (
                          <button
                            onClick={() => handleValiderDepense(d.idDepense)}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold transition-colors cursor-pointer"
                            title="Approuver cette dépense"
                          >
                            Valider ✓
                          </button>
                        )}
                        {!d.estAnnulee && isBoss && (
                          <button
                            onClick={() => {
                              setDepenseAAnnuler(d);
                              setMotifAnnulation('');
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Annuler cette dépense"
                          >
                            <Ban className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: New Expense */}
      {modalOuvert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
              <div className="flex items-center space-x-2">
                <Receipt className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-sm">Enregistrer une Dépense Atelier</h3>
              </div>
              <button
                onClick={() => setModalOuvert(false)}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreerDepense} className="p-6 space-y-4 text-xs">
              {erreur && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{erreur}</span>
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 mb-1">Catégorie *</label>
                <select
                  value={categorie}
                  onChange={e => {
                    const newCat = e.target.value as any;
                    setCategorie(newCat);
                    setTypeDepense(CATALOGUE_TYPES[newCat][0]);
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-hidden font-medium"
                >
                  <option value="Charges fixes">Charges fixes (Loyer, Eau, Courant...)</option>
                  <option value="Masse salariale">Masse salariale (Secrétariat, Avances...)</option>
                  <option value="Matériel & Entretien">Matériel & Entretien (Fils, Aiguilles, Machines...)</option>
                  <option value="Divers">Divers (Transport, Restauration...)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Type de dépense *</label>
                <select
                  value={typeDepense}
                  onChange={e => setTypeDepense(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-hidden font-medium"
                >
                  {(CATALOGUE_TYPES[categorie] || []).map(t => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Montant (FCFA) *</label>
                <input
                  type="number"
                  value={montant || ''}
                  onChange={e => setMontant(Number(e.target.value))}
                  placeholder="ex: 15000"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg font-black text-slate-900 focus:ring-2 focus:ring-amber-500 outline-hidden"
                  min="1"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Date</label>
                <input
                  type="date"
                  value={dateDepense}
                  onChange={e => setDateDepense(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-hidden"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Détails / Commentaire</label>
                <input
                  type="text"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="ex: Facture Sonabel septembre, 10 fermetures YKK..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-hidden"
                />
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

      {/* Modal: Boss Cancel Expense */}
      {depenseAAnnuler && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="px-6 py-4 bg-rose-600 text-white flex items-center space-x-2">
              <Ban className="w-5 h-5" />
              <h3 className="font-bold text-sm">Annulation de Dépense</h3>
            </div>
            <div className="p-6 space-y-4 text-xs">
              <p className="text-slate-600">
                Type : <strong>{depenseAAnnuler.typeDepense}</strong> — {formatFCFA(depenseAAnnuler.montant)}.
                Motif requis pour traçabilité dans le Journal d'Audit.
              </p>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Motif obligatoire *</label>
                <textarea
                  value={motifAnnulation}
                  onChange={e => setMotifAnnulation(e.target.value)}
                  placeholder="ex: Dépense saisie en double, remboursement fournisseur..."
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 outline-hidden"
                  required
                />
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <button
                  onClick={() => setDepenseAAnnuler(null)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-slate-50 cursor-pointer"
                >
                  Fermer
                </button>
                <button
                  onClick={handleConfirmerAnnulation}
                  disabled={!motifAnnulation.trim()}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold disabled:opacity-50 cursor-pointer"
                >
                  Confirmer l'annulation
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
