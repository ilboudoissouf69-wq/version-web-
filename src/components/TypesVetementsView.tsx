import React, { useState } from 'react';
import { Tag, Plus, Edit, X, AlertCircle } from 'lucide-react';
import { TypeVetementConfig, Employe } from '../types';
import { db, formatFCFA } from '../services/storage';

interface Props {
  currentUser: Employe;
}

export const TypesVetementsView: React.FC<Props> = ({ currentUser }) => {
  const [types, setTypes] = useState<TypeVetementConfig[]>(db.getTypeVetements());
  const [modalOuvert, setModalOuvert] = useState(false);
  const [editionType, setEditionType] = useState<Partial<TypeVetementConfig> | null>(null);
  const [nouveauMesure, setNouveauMesure] = useState('');
  const [erreur, setErreur] = useState('');

  const handleOuvrirNouveau = () => {
    setEditionType({
      id: `type_${Date.now()}`,
      nom: '',
      prixBase: 5000,
      descriptions: [],
      mesuresRequises: ['Longueur', 'Tour de poitrine', 'Tour de taille'],
    });
    setModalOuvert(true);
  };

  const handleOuvrirEdition = (t: TypeVetementConfig) => {
    setEditionType({ ...t });
    setModalOuvert(true);
  };

  const handleAjouterMesure = () => {
    if (!nouveauMesure.trim() || !editionType) return;
    const req = [...(editionType.mesuresRequises || [])];
    if (!req.includes(nouveauMesure.trim())) {
      req.push(nouveauMesure.trim());
      setEditionType({ ...editionType, mesuresRequises: req });
    }
    setNouveauMesure('');
  };

  const handleSupprimerMesure = (m: string) => {
    if (!editionType) return;
    setEditionType({
      ...editionType,
      mesuresRequises: (editionType.mesuresRequises || []).filter(item => item !== m),
    });
  };

  const handleSauvegarder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editionType || !editionType.nom?.trim()) {
      setErreur('Le nom du type de vêtement est obligatoire.');
      return;
    }
    try {
      db.saveTypeVetement(editionType as TypeVetementConfig);
      setTypes(db.getTypeVetements());
      setModalOuvert(false);
      setEditionType(null);
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
            <Tag className="w-6 h-6 text-amber-600" />
            <span>Catalogue des Vêtements & Mesures Requises</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configurez les types confectionnés à l'atelier et les prises de mesure standard
          </p>
        </div>
        <button
          onClick={handleOuvrirNouveau}
          className="inline-flex items-center space-x-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-md shadow-amber-600/20"
        >
          <Plus className="w-4 h-4" />
          <span>Nouveau Modèle</span>
        </button>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {types.map(t => (
          <div key={t.id} className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900">{t.nom}</h3>
                <span className="text-xs font-bold text-amber-700">Prix de base : {formatFCFA(t.prixBase)}</span>
              </div>
              <button
                onClick={() => handleOuvrirEdition(t)}
                className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
                title="Modifier"
              >
                <Edit className="w-4 h-4" />
              </button>
            </div>

            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                Mesures requises ({t.mesuresRequises.length})
              </span>
              <div className="flex flex-wrap gap-1.5">
                {t.mesuresRequises.map(m => (
                  <span
                    key={m}
                    className="px-2 py-1 bg-slate-100 text-slate-700 rounded-md text-xs font-semibold border border-slate-200"
                  >
                    {m}
                  </span>
                ))}
              </div>
            </div>

            {t.descriptions && t.descriptions.length > 0 && (
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Variantes courantes
                </span>
                <p className="text-xs text-slate-600 italic">{t.descriptions.join(', ')}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Edit Modal */}
      {modalOuvert && editionType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
            <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
              <h3 className="font-bold text-sm">Configurer un Type de Vêtement</h3>
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
                <label className="block font-bold text-slate-700 mb-1">Nom du modèle *</label>
                <input
                  type="text"
                  value={editionType.nom || ''}
                  onChange={e => setEditionType({ ...editionType, nom: e.target.value })}
                  placeholder="ex: Ensemble Danfani, Robe de mariée..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-hidden font-bold"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Prix de confection de base (FCFA) *</label>
                <input
                  type="number"
                  value={editionType.prixBase || 0}
                  onChange={e => setEditionType({ ...editionType, prixBase: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-hidden font-bold"
                  min="0"
                  step="500"
                  required
                />
              </div>

              {/* Required measurements manager */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Mesures Requises</label>
                <div className="flex space-x-2 mb-2">
                  <input
                    type="text"
                    value={nouveauMesure}
                    onChange={e => setNouveauMesure(e.target.value)}
                    placeholder="Ajouter une mesure (ex: Tour de cuisse, Épaule)..."
                    className="flex-1 px-3 py-1.5 border border-slate-300 rounded-lg outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={handleAjouterMesure}
                    className="px-3 py-1.5 bg-slate-900 text-white font-bold rounded-lg cursor-pointer"
                  >
                    Ajouter
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5 p-3 bg-slate-50 border border-slate-200 rounded-lg min-h-[60px]">
                  {(editionType.mesuresRequises || []).map(m => (
                    <span
                      key={m}
                      className="inline-flex items-center space-x-1 px-2.5 py-1 bg-white border border-slate-300 text-slate-800 rounded-md font-semibold text-xs shadow-2xs"
                    >
                      <span>{m}</span>
                      <button
                        type="button"
                        onClick={() => handleSupprimerMesure(m)}
                        className="text-slate-400 hover:text-rose-600 ml-1 cursor-pointer"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
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
                  Enregistrer Modèle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
