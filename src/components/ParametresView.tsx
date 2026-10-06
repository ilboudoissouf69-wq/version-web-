import React, { useState } from 'react';
import {
  Settings,
  Save,
  Download,
  Upload,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Building,
  Phone,
  MessageSquare,
  FileText,
} from 'lucide-react';
import { ParametresApp, Employe } from '../types';
import { db } from '../services/storage';

interface Props {
  currentUser: Employe;
}

export const ParametresView: React.FC<Props> = ({ currentUser }) => {
  const [params, setParams] = useState<ParametresApp>(db.getParametres());
  const [message, setMessage] = useState('');
  const [erreur, setErreur] = useState('');

  const handleEnregistrer = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setErreur('');
    try {
      db.saveParametres(params);
      setMessage('Paramètres enregistrés avec succès !');
    } catch (err: unknown) {
      if (err instanceof Error) setErreur(err.message);
    }
  };

  const handleExportBackup = () => {
    const json = db.exportBackup();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gestion_couture_sauvegarde_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = evt => {
      try {
        const content = evt.target?.result as string;
        db.importBackup(content);
        setParams(db.getParametres());
        alert('Sauvegarde restaurée avec succès ! La page va s\'actualiser.');
        window.location.reload();
      } catch (err: unknown) {
        if (err instanceof Error) alert(`Erreur de restauration : ${err.message}`);
      }
    };
    reader.readAsText(file);
  };

  const handleResetDemoData = () => {
    if (
      window.confirm(
        'Voulez-vous réinitialiser toutes les données de l\'atelier avec les données de démonstration officielles ?'
      )
    ) {
      db.initDatabase(true);
      alert('Données réinitialisées avec succès !');
      window.location.reload();
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-xl font-black text-slate-900 flex items-center space-x-2">
          <Settings className="w-6 h-6 text-amber-600" />
          <span>Paramètres de l'Atelier & Sauvegardes</span>
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Identité de l'atelier, modèles de messages WhatsApp, exports et importations de secours
        </p>
      </div>

      {message && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center space-x-2">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {erreur && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{erreur}</span>
        </div>
      )}

      <form onSubmit={handleEnregistrer} className="space-y-6 text-xs">
        {/* Workshop Profile */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
            <Building className="w-5 h-5 text-amber-600" />
            <h2 className="text-sm font-bold text-slate-900 uppercase">Identité de l'Atelier</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Nom de l'atelier *</label>
              <input
                type="text"
                value={params.nomAtelier}
                onChange={e => setParams({ ...params, nomAtelier: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-hidden font-bold"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Numéro Téléphone / WhatsApp *</label>
              <input
                type="text"
                value={params.telephone}
                onChange={e => setParams({ ...params, telephone: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-hidden font-medium"
                required
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-700 mb-1">Adresse complète / Quartier</label>
              <input
                type="text"
                value={params.adresse}
                onChange={e => setParams({ ...params, adresse: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-hidden font-medium"
              />
            </div>
          </div>
        </div>

        {/* Financial and Alerts Defaults */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
            <FileText className="w-5 h-5 text-amber-600" />
            <h2 className="text-sm font-bold text-slate-900 uppercase">Règles Métier & Alertes</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Délai d'alerte RDV (jours à l'avance)</label>
              <input
                type="number"
                value={params.delaiAlerteJours}
                onChange={e => setParams({ ...params, delaiAlerteJours: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-hidden font-bold"
                min="1"
                max="30"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Taux de commission par défaut (%)</label>
              <input
                type="number"
                value={params.pourcentageCommissionDefaut}
                onChange={e => setParams({ ...params, pourcentageCommissionDefaut: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-hidden font-bold"
                min="1"
                max="100"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-700 mb-1">Mention légale au bas des reçus</label>
              <input
                type="text"
                value={params.noteRecu}
                onChange={e => setParams({ ...params, noteRecu: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-hidden"
              />
            </div>
          </div>
        </div>

        {/* WhatsApp Message Templates */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
            <MessageSquare className="w-5 h-5 text-emerald-600" />
            <h2 className="text-sm font-bold text-slate-900 uppercase">Modèles de Messages WhatsApp Automatiques</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Notification "Commande Prête" ({'{Nom}'}, {'{Commande}'}, {'{Pieces}'}, {'{Reste}'}, {'{Atelier}'})
              </label>
              <textarea
                value={params.messageCommandePrete}
                onChange={e => setParams({ ...params, messageCommandePrete: e.target.value })}
                rows={4}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-hidden font-mono text-xs"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Notification "Rappel RDV" ({'{Nom}'}, {'{Date}'}, {'{Heure}'}, {'{Atelier}'})
              </label>
              <textarea
                value={params.messageRappelRdv}
                onChange={e => setParams({ ...params, messageRappelRdv: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-hidden font-mono text-xs"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold flex items-center space-x-2 cursor-pointer shadow-md shadow-amber-600/20"
          >
            <Save className="w-4 h-4" />
            <span>Enregistrer les Paramètres</span>
          </button>
        </div>
      </form>

      {/* Backup and Restore Section */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4 text-xs">
        <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
          <Download className="w-5 h-5 text-blue-600" />
          <h2 className="text-sm font-bold text-slate-900 uppercase">Sauvegarde & Restauration de la Base de Données</h2>
        </div>

        <p className="text-slate-600">
          Exportez l'intégralité de la base de données de l'atelier (clients, mesures, commandes, paiements, journal
          d'audit) sous forme de fichier JSON sécurisé, ou restaurez un fichier existant.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            type="button"
            onClick={handleExportBackup}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center space-x-1.5 cursor-pointer shadow-xs"
          >
            <Download className="w-4 h-4" />
            <span>Télécharger une Sauvegarde JSON</span>
          </button>

          <label className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold flex items-center space-x-1.5 cursor-pointer border border-slate-300">
            <Upload className="w-4 h-4" />
            <span>Restaurer une Sauvegarde</span>
            <input type="file" accept=".json" onChange={handleImportBackup} className="hidden" />
          </label>

          <button
            type="button"
            onClick={handleResetDemoData}
            className="px-4 py-2 text-rose-600 hover:bg-rose-50 rounded-xl font-semibold flex items-center space-x-1.5 cursor-pointer ml-auto border border-rose-200"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Réinitialiser Données Démo</span>
          </button>
        </div>
      </div>
    </div>
  );
};
