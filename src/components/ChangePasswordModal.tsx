import React, { useState } from 'react';
import { Lock, X, Check, AlertCircle } from 'lucide-react';
import { db } from '../services/storage';
import { Employe } from '../types';

interface Props {
  user: Employe;
  onClose: () => void;
  onSuccess: () => void;
}

export const ChangePasswordModal: React.FC<Props> = ({ user, onClose, onSuccess }) => {
  const [ancienMdp, setAncienMdp] = useState('');
  const [nouveauMdp, setNouveauMdp] = useState('');
  const [confirmMdp, setConfirmMdp] = useState('');
  const [erreur, setErreur] = useState('');
  const [succes, setSucces] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErreur('');
    setSucces('');

    if (nouveauMdp !== confirmMdp) {
      setErreur('Les nouveaux mots de passe ne correspondent pas.');
      return;
    }

    try {
      db.changePassword(user.idEmploye, ancienMdp, nouveauMdp);
      setSucces('Mot de passe mis à jour avec succès !');
      setTimeout(() => {
        onSuccess();
      }, 1200);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErreur(err.message);
      } else {
        setErreur('Erreur lors du changement de mot de passe.');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
          <div className="flex items-center space-x-2">
            <Lock className="w-5 h-5 text-amber-400" />
            <h3 className="font-semibold text-sm">Changer de mot de passe</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {erreur && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{erreur}</span>
            </div>
          )}
          {succes && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 text-xs flex items-center space-x-2">
              <Check className="w-4 h-4 shrink-0" />
              <span>{succes}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Ancien mot de passe</label>
            <input
              type="password"
              value={ancienMdp}
              onChange={e => setAncienMdp(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-hidden"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Nouveau mot de passe (min. 6 caractères)</label>
            <input
              type="password"
              value={nouveauMdp}
              onChange={e => setNouveauMdp(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-hidden"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Confirmer le nouveau mot de passe</label>
            <input
              type="password"
              value={confirmMdp}
              onChange={e => setConfirmMdp(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-hidden"
              required
            />
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-medium transition-colors cursor-pointer shadow-xs"
            >
              Enregistrer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
