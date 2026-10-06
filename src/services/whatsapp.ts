import { Commande, Client } from '../types';
import { db, formatFCFA } from './storage';

export function normaliserTelephone(tel: string): string {
  if (!tel) return '';
  let clean = tel.replace(/[^\d+]/g, '');
  if (clean.startsWith('+')) clean = clean.substring(1);
  if (clean.startsWith('00')) clean = clean.substring(2);
  // Default prefix for Burkina Faso is 226
  if (!clean.startsWith('226') && clean.length <= 8) {
    clean = '226' + clean;
  }
  return clean;
}

export function genererLienWhatsApp(telephone: string, message: string): string {
  const num = normaliserTelephone(telephone);
  return `https://wa.me/${num}?text=${encodeURIComponent(message)}`;
}

export function genererMessageCommandePrete(commande: Commande): string {
  const params = db.getParametres();
  const nomClient = commande.client ? `${commande.client.prenom} ${commande.client.nom}` : 'Client';
  const pieces = commande.pieces.map(p => p.typeVetement).join(' + ');

  const totalCouture = commande.pieces.reduce((s, p) => s + p.montantCouture, 0);
  const totalMat = (commande.materielSupplements || []).reduce((s, m) => s + m.montant, 0);
  const totalFacture = totalCouture + totalMat;
  const paye = (commande.paiements || []).filter(p => !p.estAnnule).reduce((s, p) => s + p.montantPaye, 0);
  const reste = Math.max(0, totalFacture - paye);

  let msg = params.messageCommandePrete;
  msg = msg.replace(/{Nom}/g, nomClient);
  msg = msg.replace(/{Commande}/g, String(commande.idCommande));
  msg = msg.replace(/{Pieces}/g, pieces || 'vos vêtements');
  msg = msg.replace(/{Atelier}/g, params.nomAtelier);
  msg = msg.replace(/{Reste}/g, formatFCFA(reste));
  return msg;
}

export function genererMessageRappelRdv(commande: Commande): string {
  const params = db.getParametres();
  const nomClient = commande.client ? `${commande.client.prenom} ${commande.client.nom}` : 'Client';
  const dateStr = new Date(commande.dateFin).toLocaleDateString('fr-FR');
  const heureStr = commande.heureDebut || '10:00';

  let msg = params.messageRappelRdv;
  msg = msg.replace(/{Nom}/g, nomClient);
  msg = msg.replace(/{Date}/g, dateStr);
  msg = msg.replace(/{Heure}/g, heureStr);
  msg = msg.replace(/{Atelier}/g, params.nomAtelier);
  return msg;
}
