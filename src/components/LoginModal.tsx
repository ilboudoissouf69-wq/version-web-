import React, { useState } from 'react';
import { Scissors, Lock, User, AlertCircle, LogIn } from 'lucide-react';
import { db } from '../services/storage';
import { Employe } from '../types';

interface Props {
  onSuccess: (user: Employe) => void;
  onCancel?: () => void;
}

export const LoginModal: React.FC<Props> = ({ onSuccess, onCancel }) => {
  const [identifiant, setIdentifiant] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [erreur, setErreur] = useState('');
  const [chargement, setChargement] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErreur('');
    if (!identifiant.trim() || !motDePasse) {
      setErreur('Veuillez renseigner votre identifiant et votre mot de passe.');
      return;
    }

    setChargement(true);
    try {
      const user = db.authenticate(identifiant, motDePasse);
      onSuccess(user);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErreur(err.message);
      } else {
        setErreur('Erreur de connexion.');
      }
    } finally {
      setChargement(false);
    }
  };

  const setDemoUser = (id: string, pass: string) => {
    setIdentifiant(id);
    setMotDePasse(pass);
    setErreur('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950 p-6 text-center text-white relative">
          <div className="mx-auto w-14 h-14 bg-amber-500/20 border border-amber-500/40 rounded-xl flex items-center justify-center mb-3">
            <Scissors className="w-8 h-8 text-amber-400" />
          </div>
          <h2 className="text-xl font-bold tracking-tight">Gestion Couture</h2>
          <p className="text-xs text-amber-200/80 mt-1">Atelier Ilboudo — Authentification</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {erreur && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{erreur}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Identifiant</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={identifiant}
                onChange={e => setIdentifiant(e.target.value)}
                placeholder="ex: boss, secretaire01, couturier001"
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-hidden"
                autoFocus
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Mot de passe</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="password"
                value={motDePasse}
                onChange={e => setMotDePasse(e.target.value)}
                placeholder="Votre mot de passe"
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-hidden"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={chargement}
            className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-lg text-sm transition-colors flex items-center justify-center space-x-2 cursor-pointer shadow-md shadow-amber-600/20 disabled:opacity-50"
          >
            <LogIn className="w-4 h-4" />
            <span>Se connecter</span>
          </button>

          {/* Fast switch demo buttons */}
          <div className="border-t border-slate-200 pt-4 text-xs text-slate-500">
            <p className="font-semibold text-slate-600 mb-2">Comptes rapides de démonstration :</p>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => setDemoUser('boss', 'boss123')}
                className="px-2 py-1.5 bg-slate-100 hover:bg-slate-200 rounded text-slate-700 font-medium text-center border border-slate-200 cursor-pointer"
              >
                👑 Boss
              </button>
              <button
                type="button"
                onClick={() => setDemoUser('secretaire01', 'sec01pass')}
                className="px-2 py-1.5 bg-slate-100 hover:bg-slate-200 rounded text-slate-700 font-medium text-center border border-slate-200 cursor-pointer"
              >
                📋 Secrétaire
              </button>
              <button
                type="button"
                onClick={() => setDemoUser('couturier001', 'cou001pass')}
                className="px-2 py-1.5 bg-slate-100 hover:bg-slate-200 rounded text-slate-700 font-medium text-center border border-slate-200 cursor-pointer"
              >
                ✂️ Couturier
              </button>
            </div>
          </div>

          {onCancel && (
            <div className="text-center pt-1">
              <button
                type="button"
                onClick={onCancel}
                className="text-xs text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
              >
                Fermer
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
