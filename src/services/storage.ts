import {
  Employe,
  Client,
  Commande,
  PieceCommande,
  Paiement,
  Commission,
  Depense,
  Retour,
  JournalAudit,
  TypeVetementConfig,
  ParametresApp,
  ApercuCommissionItem,
  BilanFinancier,
} from '../types';

const STORAGE_KEYS = {
  EMPLOYES: 'gc_employes',
  CLIENTS: 'gc_clients',
  COMMANDES: 'gc_commandes',
  PAIEMENTS: 'gc_paiements',
  COMMISSIONS: 'gc_commissions',
  DEPENSES: 'gc_depenses',
  RETOURS: 'gc_retours',
  AUDIT: 'gc_audit',
  TYPES_VETEMENTS: 'gc_types_vetements',
  PARAMETRES: 'gc_parametres',
  CURRENT_USER: 'gc_current_user',
  INITIALIZED: 'gc_initialized_v2',
};

export const DEFAULT_PARAMETRES: ParametresApp = {
  nomAtelier: 'Atelier de Couture Ilboudo',
  telephone: '+226 70 12 34 56',
  adresse: 'Ouagadougou, Secteur 15 — Burkina Faso',
  devise: 'FCFA',
  delaiAlerteJours: 2,
  pourcentageCommissionDefaut: 30,
  messageCommandePrete: 'Bonjour {Nom},\n\nBonne nouvelle ! Votre commande #{Commande} ({Pieces}) est prête chez {Atelier}. ✂️🎉\n💰 Reste à payer : {Reste} FCFA.\nNous vous attendons. Merci pour votre confiance !',
  messageRappelRdv: 'Rappel {Atelier} ⏰\n\nBonjour {Nom}, votre rendez-vous pour les essayages/retrait est fixé le {Date} à {Heure}.\nMerci pour votre ponctualité !',
  noteRecu: 'Merci de votre confiance ! Les commandes non retirées au bout de 90 jours feront l\'objet de frais de gardiennage.',
};

export const DEFAULT_TYPES_VETEMENTS: TypeVetementConfig[] = [
  {
    id: 'pantalon',
    nom: 'Pantalon',
    prixBase: 5000,
    descriptions: ['Coupe droite classique', 'Coupe slim / ajustée', 'Avec poches latérales', 'Avec pinces'],
    mesuresRequises: ['Longueur', 'Tour de taille', 'Tour de cuisse', 'Entrejambe', 'Bas de patte'],
  },
  {
    id: 'chemise',
    nom: 'Chemise',
    prixBase: 4000,
    descriptions: ['Col chemise classique', 'Col V', 'Manches longues', 'Manches courtes'],
    mesuresRequises: ['Longueur dos', 'Tour de poitrine', 'Tour d\'épaule', 'Longueur manche', 'Tour de poignet'],
  },
  {
    id: 'robe',
    nom: 'Robe',
    prixBase: 8000,
    descriptions: ['Robe longue', 'Robe midi', 'Robe courte', 'Avec ceinture', 'Robe de soirée'],
    mesuresRequises: ['Longueur', 'Tour de poitrine', 'Tour de taille', 'Tour de hanches', 'Longueur épaule'],
  },
  {
    id: 'boubou',
    nom: 'Boubou',
    prixBase: 6000,
    descriptions: ['Boubou classique', 'Boubou brodé', 'Boubou avec poche', 'Boubou 3 pièces'],
    mesuresRequises: ['Longueur', 'Tour de poitrine', 'Longueur manche', 'Largeur col'],
  },
  {
    id: 'veste',
    nom: 'Veste',
    prixBase: 10000,
    descriptions: ['Veste classique', 'Veste cintrée', 'Avec boutons', 'Sans manches', 'Veste costume'],
    mesuresRequises: ['Longueur', 'Tour de poitrine', 'Tour de taille', 'Longueur manche', 'Épaisseur épaule'],
  },
];

// Simple SHA-256 for browser environment
async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Accent insensitive search (like TexteHelper.cs)
export function normaliserTexte(texte: string): string {
  if (!texte) return '';
  return texte
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function formatFCFA(montant: number): string {
  return new Intl.NumberFormat('fr-FR').format(Math.round(montant)) + ' FCFA';
}

class StorageService {
  constructor() {
    this.initDatabase();
  }

  public initDatabase(force: boolean = false) {
    if (!force && localStorage.getItem(STORAGE_KEYS.INITIALIZED)) {
      return;
    }

    // Initialize default admin Boss
    const defaultBoss: Employe = {
      idEmploye: 1,
      nom: 'ILBOUDO',
      prenom: 'Issouf',
      identifiant: 'boss',
      motDePasse: 'boss123',
      role: 'Boss',
      statut: 'Actif',
      derniereModificationMotDePasse: new Date().toISOString(),
    };

    // 2 Secretaires
    const secretaires: Employe[] = [
      {
        idEmploye: 2,
        nom: 'Kaboré',
        prenom: 'Aminata',
        identifiant: 'secretaire01',
        motDePasse: 'sec01pass',
        role: 'Secretaire',
        statut: 'Actif',
      },
      {
        idEmploye: 3,
        nom: 'Sawadogo',
        prenom: 'Fatoumata',
        identifiant: 'secretaire02',
        motDePasse: 'sec02pass',
        role: 'Secretaire',
        statut: 'Actif',
      },
    ];

    // 5 Couturiers
    const couturiers: Employe[] = [
      {
        idEmploye: 4,
        nom: 'Ouedraogo',
        prenom: 'Moussa',
        identifiant: 'couturier001',
        motDePasse: 'cou001pass',
        role: 'Couturier',
        statut: 'Actif',
      },
      {
        idEmploye: 5,
        nom: 'Diallo',
        prenom: 'Ibrahim',
        identifiant: 'couturier002',
        motDePasse: 'cou002pass',
        role: 'Couturier',
        statut: 'Actif',
      },
      {
        idEmploye: 6,
        nom: 'Traoré',
        prenom: 'Boubacar',
        identifiant: 'couturier003',
        motDePasse: 'cou003pass',
        role: 'Couturier',
        statut: 'Actif',
      },
      {
        idEmploye: 7,
        nom: 'Coulibaly',
        prenom: 'Adama',
        identifiant: 'couturier004',
        motDePasse: 'cou004pass',
        role: 'Couturier',
        statut: 'Actif',
      },
      {
        idEmploye: 8,
        nom: 'Konaté',
        prenom: 'Hamidou',
        identifiant: 'couturier005',
        motDePasse: 'cou005pass',
        role: 'Couturier',
        statut: 'Actif',
      },
    ];

    const employes = [defaultBoss, ...secretaires, ...couturiers];

    // Initial Clients
    const clients: Client[] = [
      { idClient: 1, nom: 'Compaoré', prenom: 'Alassane', telephone: '70 23 45 67', dateCreation: '2026-08-01' },
      { idClient: 2, nom: 'Nikiéma', prenom: 'Rasmata', telephone: '76 54 32 10', dateCreation: '2026-08-05' },
      { idClient: 3, nom: 'Zongo', prenom: 'Ousmane', telephone: '78 11 22 33', dateCreation: '2026-08-10' },
      { idClient: 4, nom: 'Tapsoba', prenom: 'Mariam', telephone: '65 43 21 09', dateCreation: '2026-08-15' },
      { idClient: 5, nom: 'Sankara', prenom: 'Cheick', telephone: '71 88 99 00', dateCreation: '2026-08-20' },
      { idClient: 6, nom: 'Badini', prenom: 'Aïssata', telephone: '74 33 22 11', dateCreation: '2026-08-25' },
      { idClient: 7, nom: 'Tiendrebeogo', prenom: 'Modibo', telephone: '79 00 11 22', dateCreation: '2026-09-01' },
      { idClient: 8, nom: 'Rouamba', prenom: 'Balkissa', telephone: '72 44 55 66', dateCreation: '2026-09-05' },
    ];

    // Initial Commandes with multi-pieces
    const commandes: Commande[] = [
      {
        idCommande: 1,
        idClient: 1,
        dateDebut: '2026-09-20',
        dateFin: '2026-10-02',
        heureDebut: '09:00',
        idOperateurCreation: 2,
        nomOperateurCreation: 'Aminata Kaboré',
        dateCreation: '2026-09-20T09:15:00Z',
        estSupprimee: false,
        materielSupplements: [
          { idMateriel: 1, designation: 'Boutons dorés luxe', quantite: 1, prixUnitaire: 2000, montant: 2000 },
        ],
        pieces: [
          {
            idPieceCommande: 1,
            idCommande: 1,
            typeVetement: 'Boubou',
            descriptionPrecision: 'Boubou 3 pièces avec broderie dorée au col et poches',
            idCouturier: 4,
            couturierNom: 'Moussa Ouedraogo',
            montantCouture: 18000,
            statut: 'Livree',
            mesures: [
              { nomMesure: 'Longueur', valeur: '140' },
              { nomMesure: 'Tour de poitrine', valeur: '112' },
              { nomMesure: 'Longueur manche', valeur: '72' },
              { nomMesure: 'Largeur col', valeur: '18' },
            ],
            materielSupplements: [],
          },
          {
            idPieceCommande: 2,
            idCommande: 1,
            typeVetement: 'Pantalon',
            descriptionPrecision: 'Pantalon assorti coupe droite classique',
            idCouturier: 4,
            couturierNom: 'Moussa Ouedraogo',
            montantCouture: 6000,
            statut: 'Livree',
            mesures: [
              { nomMesure: 'Longueur', valeur: '104' },
              { nomMesure: 'Tour de taille', valeur: '88' },
              { nomMesure: 'Tour de cuisse', valeur: '58' },
            ],
            materielSupplements: [],
          },
        ],
        paiements: [],
      },
      {
        idCommande: 2,
        idClient: 2,
        dateDebut: '2026-09-25',
        dateFin: '2026-10-06',
        heureDebut: '10:30',
        idOperateurCreation: 2,
        nomOperateurCreation: 'Aminata Kaboré',
        dateCreation: '2026-09-25T10:30:00Z',
        estSupprimee: false,
        materielSupplements: [
          { idMateriel: 2, designation: 'Fermeture éclair invisible et doublure', quantite: 1, prixUnitaire: 1500, montant: 1500 },
        ],
        pieces: [
          {
            idPieceCommande: 3,
            idCommande: 2,
            typeVetement: 'Robe',
            descriptionPrecision: 'Robe longue pour cérémonie tissu Faso Danfani',
            idCouturier: 5,
            couturierNom: 'Ibrahim Diallo',
            montantCouture: 15000,
            statut: 'Terminee',
            mesures: [
              { nomMesure: 'Longueur', valeur: '130' },
              { nomMesure: 'Tour de poitrine', valeur: '96' },
              { nomMesure: 'Tour de taille', valeur: '76' },
              { nomMesure: 'Tour de hanches', valeur: '102' },
            ],
            materielSupplements: [],
          },
        ],
        paiements: [],
      },
      {
        idCommande: 3,
        idClient: 3,
        dateDebut: '2026-09-28',
        dateFin: '2026-10-08',
        heureDebut: '14:00',
        idOperateurCreation: 3,
        nomOperateurCreation: 'Fatoumata Sawadogo',
        dateCreation: '2026-09-28T14:00:00Z',
        estSupprimee: false,
        materielSupplements: [],
        pieces: [
          {
            idPieceCommande: 4,
            idCommande: 3,
            typeVetement: 'Veste',
            descriptionPrecision: 'Veste cintrée deux boutons tissu coton lourd',
            idCouturier: 6,
            couturierNom: 'Boubacar Traoré',
            montantCouture: 16000,
            statut: 'En cours',
            mesures: [
              { nomMesure: 'Longueur', valeur: '70' },
              { nomMesure: 'Tour de poitrine', valeur: '102' },
              { nomMesure: 'Tour de taille', valeur: '86' },
              { nomMesure: 'Longueur manche', valeur: '62' },
            ],
            materielSupplements: [],
          },
          {
            idPieceCommande: 5,
            idCommande: 3,
            typeVetement: 'Pantalon',
            descriptionPrecision: 'Pantalon habillé avec pli frontal',
            idCouturier: 6,
            couturierNom: 'Boubacar Traoré',
            montantCouture: 7000,
            statut: 'En cours',
            mesures: [
              { nomMesure: 'Longueur', valeur: '102' },
              { nomMesure: 'Tour de taille', valeur: '84' },
            ],
            materielSupplements: [],
          },
        ],
        paiements: [],
      },
      {
        idCommande: 4,
        idClient: 4,
        dateDebut: '2026-10-01',
        dateFin: '2026-10-12',
        heureDebut: '11:00',
        idOperateurCreation: 2,
        nomOperateurCreation: 'Aminata Kaboré',
        dateCreation: '2026-10-01T11:00:00Z',
        estSupprimee: false,
        materielSupplements: [],
        pieces: [
          {
            idPieceCommande: 6,
            idCommande: 4,
            typeVetement: 'Chemise',
            descriptionPrecision: 'Chemise col mao manches longues tissu lin',
            idCouturier: 7,
            couturierNom: 'Adama Coulibaly',
            montantCouture: 6500,
            statut: 'A faire',
            mesures: [
              { nomMesure: 'Longueur dos', valeur: '74' },
              { nomMesure: 'Tour de poitrine', valeur: '98' },
              { nomMesure: 'Tour d\'épaule', valeur: '44' },
            ],
            materielSupplements: [],
          },
        ],
        paiements: [],
      },
      {
        idCommande: 5,
        idClient: 5,
        dateDebut: '2026-09-15',
        dateFin: '2026-09-28', // Delay
        heureDebut: '16:00',
        idOperateurCreation: 1,
        nomOperateurCreation: 'Issouf ILBOUDO',
        dateCreation: '2026-09-15T16:00:00Z',
        estSupprimee: false,
        materielSupplements: [],
        pieces: [
          {
            idPieceCommande: 7,
            idCommande: 5,
            typeVetement: 'Boubou',
            descriptionPrecision: 'Grand Boubou traditionnel brodé',
            idCouturier: 8,
            couturierNom: 'Hamidou Konaté',
            montantCouture: 14000,
            statut: 'En cours',
            mesures: [
              { nomMesure: 'Longueur', valeur: '142' },
              { nomMesure: 'Tour de poitrine', valeur: '116' },
            ],
            materielSupplements: [],
          },
        ],
        paiements: [],
      },
    ];

    // Seed Paiements
    const paiements: Paiement[] = [
      {
        idPaiement: 1,
        idCommande: 1,
        montantPaye: 15000,
        datePaiement: '2026-09-20T09:30:00Z',
        modePaiement: 'Especes',
        recuNumero: 'REC-20260920-0001',
        idOperateur: 2,
        nomOperateur: 'Aminata Kaboré',
        estAnnule: false,
        montantTotalCommande: 24000,
        resteAvantPaiement: 26000,
      },
      {
        idPaiement: 2,
        idCommande: 1,
        montantPaye: 11000,
        datePaiement: '2026-10-02T15:20:00Z',
        modePaiement: 'Mobile Money',
        recuNumero: 'REC-20261002-0002',
        idOperateur: 2,
        nomOperateur: 'Aminata Kaboré',
        estAnnule: false,
        montantTotalCommande: 24000,
        resteAvantPaiement: 11000,
      },
      {
        idPaiement: 3,
        idCommande: 2,
        montantPaye: 10000,
        datePaiement: '2026-09-25T10:45:00Z',
        modePaiement: 'Mobile Money',
        recuNumero: 'REC-20260925-0003',
        idOperateur: 2,
        nomOperateur: 'Aminata Kaboré',
        estAnnule: false,
        montantTotalCommande: 15000,
        resteAvantPaiement: 16500,
      },
      {
        idPaiement: 4,
        idCommande: 3,
        montantPaye: 12000,
        datePaiement: '2026-09-28T14:15:00Z',
        modePaiement: 'Especes',
        recuNumero: 'REC-20260928-0004',
        idOperateur: 3,
        nomOperateur: 'Fatoumata Sawadogo',
        estAnnule: false,
        montantTotalCommande: 23000,
        resteAvantPaiement: 23000,
      },
    ];

    // Seed Depenses
    const depenses: Depense[] = [
      {
        idDepense: 1,
        categorie: 'Charges fixes',
        typeDepense: 'Loyer',
        montant: 50000,
        dateDepense: '2026-09-01',
        description: 'Loyer mensuel atelier',
        idOperateur: 1,
        nomOperateur: 'Issouf ILBOUDO',
        statutValidation: 'Validee',
        estAnnulee: false,
      },
      {
        idDepense: 2,
        categorie: 'Matériel & Entretien',
        typeDepense: 'Fils & Accessoires',
        montant: 12500,
        dateDepense: '2026-09-12',
        description: 'Rouleaux de fils assortis, fermetures, aiguilles machine',
        idOperateur: 2,
        nomOperateur: 'Aminata Kaboré',
        statutValidation: 'Validee',
        estAnnulee: false,
      },
      {
        idDepense: 3,
        categorie: 'Charges fixes',
        typeDepense: 'Électricité',
        montant: 18000,
        dateDepense: '2026-09-18',
        description: 'Facture Sonabel atelier',
        idOperateur: 1,
        nomOperateur: 'Issouf ILBOUDO',
        statutValidation: 'Validee',
        estAnnulee: false,
      },
      {
        idDepense: 4,
        categorie: 'Matériel & Entretien',
        typeDepense: 'Réparation machine',
        montant: 8000,
        dateDepense: '2026-09-29',
        description: 'Révision machine à coudre Juki n°2',
        idOperateur: 3,
        nomOperateur: 'Fatoumata Sawadogo',
        statutValidation: 'En attente',
        estAnnulee: false,
      },
    ];

    // Seed Retours
    const retours: Retour[] = [
      {
        idRetour: 1,
        idCommande: 1,
        idPieceCommande: 2,
        idCouturier: 4,
        idCouturierReprise: 4,
        descriptionProbleme: 'Bas de patte un peu trop long de 2 cm, à raccourcir légèrement',
        statut: 'Pret',
        dateSignalement: '2026-10-03',
        dateRdvReprise: '2026-10-05',
        heureDebutReprise: '15:00',
        idOperateurEnregistrement: 2,
        nomOperateurEnregistrement: 'Aminata Kaboré',
        estAnnule: false,
      },
    ];

    // Save everything
    localStorage.setItem(STORAGE_KEYS.EMPLOYES, JSON.stringify(employes));
    localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(clients));
    localStorage.setItem(STORAGE_KEYS.COMMANDES, JSON.stringify(commandes));
    localStorage.setItem(STORAGE_KEYS.PAIEMENTS, JSON.stringify(paiements));
    localStorage.setItem(STORAGE_KEYS.COMMISSIONS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.DEPENSES, JSON.stringify(depenses));
    localStorage.setItem(STORAGE_KEYS.RETOURS, JSON.stringify(retours));
    localStorage.setItem(STORAGE_KEYS.AUDIT, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.TYPES_VETEMENTS, JSON.stringify(DEFAULT_TYPES_VETEMENTS));
    localStorage.setItem(STORAGE_KEYS.PARAMETRES, JSON.stringify(DEFAULT_PARAMETRES));
    localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');

    // Default current user (Boss)
    if (!localStorage.getItem(STORAGE_KEYS.CURRENT_USER)) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(defaultBoss));
    }
  }

  // ---------------- AUTH & EMPLOYES ----------------
  public getCurrentUser(): Employe | null {
    const raw = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    return raw ? JSON.parse(raw) : null;
  }

  public setCurrentUser(user: Employe | null) {
    if (user) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    }
  }

  public getEmployes(): Employe[] {
    const raw = localStorage.getItem(STORAGE_KEYS.EMPLOYES);
    return raw ? JSON.parse(raw) : [];
  }

  public saveEmploye(employe: Employe): Employe {
    const list = this.getEmployes();
    let updated: Employe;
    if (employe.idEmploye) {
      updated = { ...employe };
      const index = list.findIndex(e => e.idEmploye === employe.idEmploye);
      if (index >= 0) list[index] = updated;
    } else {
      const nextId = Math.max(0, ...list.map(e => e.idEmploye)) + 1;
      updated = { ...employe, idEmploye: nextId };
      list.push(updated);
    }
    localStorage.setItem(STORAGE_KEYS.EMPLOYES, JSON.stringify(list));
    return updated;
  }

  public authenticate(identifiant: string, motDePasse: string): Employe {
    const cleanId = normaliserTexte(identifiant);
    const employes = this.getEmployes();
    const user = employes.find(e => normaliserTexte(e.identifiant) === cleanId);
    if (!user) {
      throw new Error('Identifiant ou mot de passe incorrect.');
    }
    if (user.statut !== 'Actif') {
      throw new Error('Ce compte est suspendu. Veuillez contacter l\'administrateur.');
    }
    if (user.motDePasse !== motDePasse) {
      throw new Error('Identifiant ou mot de passe incorrect.');
    }
    this.setCurrentUser(user);
    return user;
  }

  public changePassword(idEmploye: number, ancienMdp: string, nouveauMdp: string) {
    if (!nouveauMdp || nouveauMdp.trim().length < 6) {
      throw new Error('Le nouveau mot de passe doit comporter au moins 6 caractères.');
    }
    const interdits = ['123456', 'password', 'admin', 'secret', 'motdepasse'];
    if (interdits.some(m => nouveauMdp.toLowerCase().includes(m))) {
      throw new Error('Ce mot de passe est trop simple. Choisissez un mot de passe plus robuste.');
    }

    const employes = this.getEmployes();
    const user = employes.find(e => e.idEmploye === idEmploye);
    if (!user) throw new Error('Employé introuvable.');

    if (user.motDePasse !== ancienMdp) {
      throw new Error('L\'ancien mot de passe est incorrect.');
    }

    user.motDePasse = nouveauMdp;
    user.derniereModificationMotDePasse = new Date().toISOString();
    localStorage.setItem(STORAGE_KEYS.EMPLOYES, JSON.stringify(employes));

    const cur = this.getCurrentUser();
    if (cur && cur.idEmploye === idEmploye) {
      this.setCurrentUser(user);
    }
  }

  // ---------------- CLIENTS ----------------
  public getClients(): Client[] {
    const raw = localStorage.getItem(STORAGE_KEYS.CLIENTS);
    return raw ? JSON.parse(raw) : [];
  }

  public saveClient(client: Partial<Client>): Client {
    if (!client.nom?.trim() || !client.prenom?.trim()) {
      throw new Error('Le nom et le prénom sont obligatoires.');
    }
    const list = this.getClients();
    let saved: Client;
    if (client.idClient) {
      const idx = list.findIndex(c => c.idClient === client.idClient);
      if (idx < 0) throw new Error('Client introuvable.');
      saved = { ...list[idx], ...client } as Client;
      list[idx] = saved;
    } else {
      const nextId = Math.max(0, ...list.map(c => c.idClient)) + 1;
      saved = {
        idClient: nextId,
        nom: client.nom.trim(),
        prenom: client.prenom.trim(),
        telephone: client.telephone?.trim() || '',
        dateCreation: new Date().toISOString().split('T')[0],
      };
      list.unshift(saved);
    }
    localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(list));
    return saved;
  }

  public deleteClient(idClient: number) {
    const commandes = this.getCommandes().filter(c => c.idClient === idClient && !c.estSupprimee);
    if (commandes.length > 0) {
      throw new Error(`Impossible de supprimer ce client : il a ${commandes.length} commande(s) enregistrée(s).`);
    }
    const list = this.getClients().filter(c => c.idClient !== idClient);
    localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(list));
  }

  // ---------------- COMMANDES & PIECES ----------------
  public getCommandes(): Commande[] {
    const raw = localStorage.getItem(STORAGE_KEYS.COMMANDES);
    const commandes: Commande[] = raw ? JSON.parse(raw) : [];
    const clients = this.getClients();
    const paiements = this.getPaiements();

    // Attach relations and computed fields
    return commandes.map(cmd => {
      const client = clients.find(c => c.idClient === cmd.idClient);
      const cmdPaiements = paiements.filter(p => p.idCommande === cmd.idCommande);
      return {
        ...cmd,
        client,
        paiements: cmdPaiements,
      };
    });
  }

  public getCommandeById(id: number): Commande | undefined {
    return this.getCommandes().find(c => c.idCommande === id);
  }

  public saveCommande(cmdData: Partial<Commande>, piecesData: Partial<PieceCommande>[]): Commande {
    if (!cmdData.idClient) throw new Error('Veuillez sélectionner un client.');
    if (!piecesData || piecesData.length === 0) throw new Error('Une commande doit comporter au moins une pièce.');

    const list = this.getCommandes();
    const currentUser = this.getCurrentUser();
    if (!currentUser) throw new Error('Session expirée. Veuillez vous reconnecter.');

    let saved: Commande;
    const isEdit = !!cmdData.idCommande;

    if (isEdit) {
      const idx = list.findIndex(c => c.idCommande === cmdData.idCommande);
      if (idx < 0) throw new Error('Commande introuvable.');
      const oldCmd = list[idx];

      const pieces: PieceCommande[] = piecesData.map((p, pIdx) => ({
        idPieceCommande: p.idPieceCommande || (Date.now() + pIdx),
        idCommande: oldCmd.idCommande,
        typeVetement: p.typeVetement || 'Vêtement',
        descriptionPrecision: p.descriptionPrecision || '',
        cheminPhoto: p.cheminPhoto || '',
        idCouturier: p.idCouturier,
        couturierNom: p.couturierNom,
        montantCouture: Number(p.montantCouture) || 0,
        statut: p.statut || 'A faire',
        mesures: p.mesures || [],
        materielSupplements: p.materielSupplements || [],
        rendezVousException: p.rendezVousException,
        idCommission: p.idCommission,
      }));

      saved = {
        ...oldCmd,
        ...cmdData,
        pieces,
      } as Commande;

      list[idx] = saved;
      this.logAudit('COMMANDE_MODIFIEE', 'Commande', saved.idCommande, oldCmd, saved, 'Mise à jour commande');
    } else {
      const nextId = Math.max(0, ...list.map(c => c.idCommande)) + 1;
      const pieces: PieceCommande[] = piecesData.map((p, pIdx) => ({
        idPieceCommande: nextId * 100 + (pIdx + 1),
        idCommande: nextId,
        typeVetement: p.typeVetement || 'Vêtement',
        descriptionPrecision: p.descriptionPrecision || '',
        cheminPhoto: p.cheminPhoto || '',
        idCouturier: p.idCouturier,
        couturierNom: p.couturierNom,
        montantCouture: Number(p.montantCouture) || 0,
        statut: p.statut || 'A faire',
        mesures: p.mesures || [],
        materielSupplements: p.materielSupplements || [],
        rendezVousException: p.rendezVousException,
      }));

      saved = {
        idCommande: nextId,
        idClient: cmdData.idClient,
        dateDebut: cmdData.dateDebut || new Date().toISOString().split('T')[0],
        dateFin: cmdData.dateFin || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
        heureDebut: cmdData.heureDebut || '09:00',
        heureFin: cmdData.heureFin,
        pieces,
        paiements: [],
        materielSupplements: cmdData.materielSupplements || [],
        idOperateurCreation: currentUser.idEmploye,
        nomOperateurCreation: `${currentUser.prenom} ${currentUser.nom}`,
        dateCreation: new Date().toISOString(),
        estSupprimee: false,
      };

      list.unshift(saved);
      this.logAudit('COMMANDE_CREEE', 'Commande', saved.idCommande, null, saved, 'Création de la commande');
    }

    localStorage.setItem(STORAGE_KEYS.COMMANDES, JSON.stringify(list));
    return saved;
  }

  public updatePieceStatut(
    idCommande: number,
    idPieceCommande: number,
    nouveauStatut: 'A faire' | 'En cours' | 'Terminee' | 'Livree',
    motifLivraisonNonSoldee?: string
  ) {
    const list = this.getCommandes();
    const cmd = list.find(c => c.idCommande === idCommande);
    if (!cmd) throw new Error('Commande introuvable.');

    const piece = cmd.pieces.find(p => p.idPieceCommande === idPieceCommande);
    if (!piece) throw new Error('Pièce introuvable.');

    const currentUser = this.getCurrentUser();
    if (!currentUser) throw new Error('Session expirée.');

    // Business Rule: Delivery of unpaid order
    if (nouveauStatut === 'Livree') {
      const totalCouture = cmd.pieces.reduce((s, p) => s + p.montantCouture, 0);
      const totalMat = (cmd.materielSupplements || []).reduce((s, m) => s + m.montant, 0);
      const totalFacture = totalCouture + totalMat;
      const totalEncaisse = (cmd.paiements || [])
        .filter(p => !p.estAnnule)
        .reduce((s, p) => s + p.montantPaye, 0);
      const reste = totalFacture - totalEncaisse;

      if (reste > 0.01) {
        if (currentUser.role !== 'Boss') {
          throw new Error(
            `Livraison impossible : la commande a un reste à payer de ${formatFCFA(reste)}. Seul le Boss peut autoriser la livraison d'une commande non soldée avec un motif.`
          );
        }
        if (!motifLivraisonNonSoldee?.trim()) {
          throw new Error('Motif obligatoire pour forcer la livraison d\'une commande non soldée.');
        }

        this.logAudit(
          'LIVRAISON_NON_SOLDEE',
          'Commande',
          cmd.idCommande,
          { reste, piece: piece.typeVetement },
          { statut: 'Livree' },
          `Livraison forcée non soldée : ${motifLivraisonNonSoldee.trim()}`
        );
      }
    }

    piece.statut = nouveauStatut;
    localStorage.setItem(STORAGE_KEYS.COMMANDES, JSON.stringify(list));
  }

  public annulerCommande(idCommande: number, motif: string) {
    if (!motif?.trim()) throw new Error('Le motif d\'annulation est obligatoire.');
    const user = this.getCurrentUser();
    if (!user || user.role !== 'Boss') throw new Error('Seul le Boss peut annuler une commande.');

    const list = this.getCommandes();
    const cmd = list.find(c => c.idCommande === idCommande);
    if (!cmd) throw new Error('Commande introuvable.');

    cmd.estSupprimee = true;
    cmd.motifSuppression = motif.trim();
    cmd.dateSuppression = new Date().toISOString();
    cmd.idOperateurSuppression = user.idEmploye;
    cmd.nomOperateurSuppression = `${user.prenom} ${user.nom}`;

    localStorage.setItem(STORAGE_KEYS.COMMANDES, JSON.stringify(list));
    this.logAudit('COMMANDE_SUPPRIMEE', 'Commande', idCommande, null, null, motif);
  }

  // ---------------- PAIEMENTS ----------------
  public getPaiements(): Paiement[] {
    const raw = localStorage.getItem(STORAGE_KEYS.PAIEMENTS);
    return raw ? JSON.parse(raw) : [];
  }

  public genererNumeroRecu(): string {
    const paiements = this.getPaiements();
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const dateStr = `${year}${month}${day}`;

    const countToday = paiements.filter(p => p.recuNumero?.startsWith(`REC-${dateStr}`)).length + 1;
    return `REC-${dateStr}-${String(countToday).padStart(4, '0')}`;
  }

  public savePaiement(idCommande: number, montantPaye: number, modePaiement: Paiement['modePaiement']): Paiement {
    if (montantPaye <= 0) throw new Error('Le montant du paiement doit être supérieur à zéro.');

    const user = this.getCurrentUser();
    if (!user) throw new Error('Session expirée.');

    const cmd = this.getCommandeById(idCommande);
    if (!cmd) throw new Error('Commande introuvable.');

    const totalCouture = cmd.pieces.reduce((s, p) => s + p.montantCouture, 0);
    const totalMat = (cmd.materielSupplements || []).reduce((s, m) => s + m.montant, 0);
    const totalFacture = totalCouture + totalMat;
    const encaisse = (cmd.paiements || []).filter(p => !p.estAnnule).reduce((s, p) => s + p.montantPaye, 0);
    const reste = totalFacture - encaisse;

    if (montantPaye > reste + 0.01) {
      throw new Error(`Le montant (${formatFCFA(montantPaye)}) dépasse le reste à payer (${formatFCFA(reste)}).`);
    }

    const paiements = this.getPaiements();
    const nextId = Math.max(0, ...paiements.map(p => p.idPaiement)) + 1;
    const recuNumero = this.genererNumeroRecu();

    const nouveauPaiement: Paiement = {
      idPaiement: nextId,
      idCommande,
      montantPaye,
      datePaiement: new Date().toISOString(),
      modePaiement,
      recuNumero,
      idOperateur: user.idEmploye,
      nomOperateur: `${user.prenom} ${user.nom}`,
      estAnnule: false,
      montantTotalCommande: totalCouture,
      resteAvantPaiement: reste,
    };

    paiements.unshift(nouveauPaiement);
    localStorage.setItem(STORAGE_KEYS.PAIEMENTS, JSON.stringify(paiements));

    this.logAudit('PAIEMENT_AJOUTE', 'Paiement', nextId, null, nouveauPaiement, `Paiement ${formatFCFA(montantPaye)} reçu`);
    return nouveauPaiement;
  }

  public annulerPaiement(idPaiement: number, motif: string) {
    if (!motif?.trim()) throw new Error('Le motif d\'annulation est obligatoire.');
    const user = this.getCurrentUser();
    if (!user || user.role !== 'Boss') throw new Error('Seul le Boss peut annuler un paiement.');

    const list = this.getPaiements();
    const p = list.find(item => item.idPaiement === idPaiement);
    if (!p) throw new Error('Paiement introuvable.');
    if (p.estAnnule) throw new Error('Ce paiement est déjà annulé.');

    p.estAnnule = true;
    p.motifsAnnulation = motif.trim();
    p.dateAnnulation = new Date().toISOString();
    p.nomAnnulateur = `${user.prenom} ${user.nom}`;

    localStorage.setItem(STORAGE_KEYS.PAIEMENTS, JSON.stringify(list));
    this.logAudit('PAIEMENT_ANNULE', 'Paiement', idPaiement, { montant: p.montantPaye }, null, motif);
  }

  // ---------------- COMMISSIONS ----------------
  public getCommissions(): Commission[] {
    const raw = localStorage.getItem(STORAGE_KEYS.COMMISSIONS);
    return raw ? JSON.parse(raw) : [];
  }

  public calculerApercuCommission(
    dateDebut: string,
    dateFin: string,
    pourcentage: number,
    surMontantEncaisse: boolean = true,
    idCouturierFiltre?: number
  ): ApercuCommissionItem[] {
    const commandes = this.getCommandes().filter(c => !c.estSupprimee);
    const retours = this.getRetours().filter(r => !r.estAnnule && (r.statut === 'Signale' || r.statut === 'En reprise'));
    const retoursPieceIds = new Set(retours.map(r => r.idPieceCommande));

    // Find all completed/delivered pieces in period not yet commissioned
    const allPieces: { piece: PieceCommande; commande: Commande }[] = [];
    commandes.forEach(cmd => {
      const dFin = cmd.dateFin;
      if (dFin >= dateDebut && dFin <= dateFin) {
        cmd.pieces.forEach(p => {
          if ((p.statut === 'Terminee' || p.statut === 'Livree') && p.idCouturier && !p.idCommission) {
            if (!retoursPieceIds.has(p.idPieceCommande)) {
              if (!idCouturierFiltre || p.idCouturier === idCouturierFiltre) {
                allPieces.push({ piece: p, commande: cmd });
              }
            }
          }
        });
      }
    });

    const couturiers = this.getEmployes().filter(e => e.statut === 'Actif' && (e.role === 'Couturier' || e.role === 'Boss'));
    const result: ApercuCommissionItem[] = [];

    couturiers.forEach(couturier => {
      const pItems = allPieces.filter(item => item.piece.idCouturier === couturier.idEmploye);
      if (pItems.length === 0) return;

      const caTotal = pItems.reduce((s, item) => s + item.piece.montantCouture, 0);

      // Proportional encaisse calculation
      let caEncaisse = 0;
      pItems.forEach(({ piece, commande }) => {
        const totalCoutureCmd = commande.pieces.reduce((s, p) => s + p.montantCouture, 0);
        const totalMatCmd = (commande.materielSupplements || []).reduce((s, m) => s + m.montant, 0);
        const totalPayeCmd = (commande.paiements || []).filter(p => !p.estAnnule).reduce((s, p) => s + p.montantPaye, 0);

        const encaisseCouture = Math.min(totalCoutureCmd, Math.max(0, totalPayeCmd - totalMatCmd));
        const prop = totalCoutureCmd > 0 ? piece.montantCouture / totalCoutureCmd : 0;
        caEncaisse += Math.round(encaisseCouture * prop);
      });

      const base = surMontantEncaisse ? caEncaisse : caTotal;
      const commission = Math.round(base * (pourcentage / 100));

      // Quality bonus: if 0 retours for this tailor in this period
      const hasDefects = this.getRetours().some(
        r => !r.estAnnule && r.idCouturier === couturier.idEmploye && r.dateSignalement >= dateDebut && r.dateSignalement <= dateFin
      );
      const primeQualite = !hasDefects && pItems.length >= 5 ? 5000 : 0;

      result.push({
        idEmploye: couturier.idEmploye,
        nom: `${couturier.prenom} ${couturier.nom}`,
        nbCommandes: new Set(pItems.map(i => i.commande.idCommande)).size,
        caTotal,
        caEncaisse,
        baseCalcul: base,
        commission,
        totalMateriaux: 0,
        totalEncaisse: caEncaisse,
        primeQualite,
        idsCommandes: Array.from(new Set(pItems.map(i => i.commande.idCommande))),
        idsPieces: pItems.map(i => i.piece.idPieceCommande),
      });
    });

    return result;
  }

  public enregistrerCommissions(
    items: ApercuCommissionItem[],
    dateDebut: string,
    dateFin: string,
    pourcentage: number,
    surMontantEncaisse: boolean
  ) {
    const user = this.getCurrentUser();
    if (!user || user.role !== 'Boss') throw new Error('Seul le Boss peut enregistrer des commissions.');

    const commissions = this.getCommissions();
    const commandes = this.getCommandes();

    items.forEach(item => {
      const nextId = Math.max(0, ...commissions.map(c => c.idCommission)) + 1;
      const comm: Commission = {
        idCommission: nextId,
        idEmploye: item.idEmploye,
        nomEmployeSnapshot: item.nom,
        dateDebutPeriode: dateDebut,
        dateFinPeriode: dateFin,
        baseCalcul: surMontantEncaisse ? 'Encaisse' : 'Total',
        pourcentage,
        baseMontant: item.baseCalcul,
        montantCommission: item.commission,
        primeQualite: item.primeQualite,
        nbCommandes: item.nbCommandes,
        dateCalcul: new Date().toISOString(),
        idOperateur: user.idEmploye,
        nomOperateur: `${user.prenom} ${user.nom}`,
        estAnnulee: false,
        piecesIds: item.idsPieces,
      };

      commissions.unshift(comm);

      // Lock pieces
      const pieceSet = new Set(item.idsPieces);
      commandes.forEach(cmd => {
        cmd.pieces.forEach(p => {
          if (pieceSet.has(p.idPieceCommande)) {
            p.idCommission = nextId;
          }
        });
      });

      this.logAudit('COMMISSION_ENREGISTREE', 'Commission', nextId, null, comm, `Commission ${formatFCFA(item.commission)}`);
    });

    localStorage.setItem(STORAGE_KEYS.COMMISSIONS, JSON.stringify(commissions));
    localStorage.setItem(STORAGE_KEYS.COMMANDES, JSON.stringify(commandes));
  }

  public annulerCommission(idCommission: number, motif: string) {
    if (!motif?.trim()) throw new Error('Le motif d\'annulation est obligatoire.');
    const user = this.getCurrentUser();
    if (!user || user.role !== 'Boss') throw new Error('Seul le Boss peut annuler une commission.');

    const commissions = this.getCommissions();
    const comm = commissions.find(c => c.idCommission === idCommission);
    if (!comm) throw new Error('Commission introuvable.');
    if (comm.estAnnulee) throw new Error('Cette commission est déjà annulée.');

    comm.estAnnulee = true;
    comm.motifAnnulation = motif.trim();
    comm.dateAnnulation = new Date().toISOString();
    comm.nomAnnulateur = `${user.prenom} ${user.nom}`;

    // Unlock pieces
    const pieceSet = new Set(comm.piecesIds || []);
    const commandes = this.getCommandes();
    commandes.forEach(cmd => {
      cmd.pieces.forEach(p => {
        if (pieceSet.has(p.idPieceCommande) && p.idCommission === idCommission) {
          p.idCommission = undefined;
        }
      });
    });

    localStorage.setItem(STORAGE_KEYS.COMMISSIONS, JSON.stringify(commissions));
    localStorage.setItem(STORAGE_KEYS.COMMANDES, JSON.stringify(commandes));
    this.logAudit('COMMISSION_ANNULEE', 'Commission', idCommission, null, null, motif);
  }

  // ---------------- DEPENSES ----------------
  public getDepenses(): Depense[] {
    const raw = localStorage.getItem(STORAGE_KEYS.DEPENSES);
    return raw ? JSON.parse(raw) : [];
  }

  public saveDepense(data: Partial<Depense>): Depense {
    if (!data.montant || data.montant <= 0) throw new Error('Le montant doit être supérieur à zéro.');
    if (!data.typeDepense?.trim()) throw new Error('Le type de dépense est obligatoire.');

    const user = this.getCurrentUser();
    if (!user) throw new Error('Session expirée.');

    const list = this.getDepenses();
    const nextId = Math.max(0, ...list.map(d => d.idDepense)) + 1;

    // Secretaire creates with "En attente", Boss creates as "Validee"
    const statutValidation = user.role === 'Boss' ? 'Validee' : 'En attente';

    const depense: Depense = {
      idDepense: nextId,
      categorie: data.categorie || 'Divers',
      typeDepense: data.typeDepense.trim(),
      montant: Number(data.montant),
      dateDepense: data.dateDepense || new Date().toISOString().split('T')[0],
      description: data.description?.trim() || '',
      idOperateur: user.idEmploye,
      nomOperateur: `${user.prenom} ${user.nom}`,
      statutValidation,
      estAnnulee: false,
    };

    list.unshift(depense);
    localStorage.setItem(STORAGE_KEYS.DEPENSES, JSON.stringify(list));
    this.logAudit('DEPENSE_AJOUTEE', 'Depense', nextId, null, depense, `Dépense ${formatFCFA(depense.montant)}`);
    return depense;
  }

  public validerDepense(idDepense: number) {
    const user = this.getCurrentUser();
    if (!user || user.role !== 'Boss') throw new Error('Seul le Boss peut valider une dépense.');

    const list = this.getDepenses();
    const dep = list.find(d => d.idDepense === idDepense);
    if (!dep) throw new Error('Dépense introuvable.');

    dep.statutValidation = 'Validee';
    localStorage.setItem(STORAGE_KEYS.DEPENSES, JSON.stringify(list));
    this.logAudit('DEPENSE_VALIDEE', 'Depense', idDepense, null, dep, 'Validation par le Boss');
  }

  public annulerDepense(idDepense: number, motif: string) {
    if (!motif?.trim()) throw new Error('Le motif d\'annulation est obligatoire.');
    const user = this.getCurrentUser();
    if (!user || user.role !== 'Boss') throw new Error('Seul le Boss peut annuler une dépense.');

    const list = this.getDepenses();
    const dep = list.find(d => d.idDepense === idDepense);
    if (!dep) throw new Error('Dépense introuvable.');

    dep.estAnnulee = true;
    dep.motifAnnulation = motif.trim();
    dep.dateAnnulation = new Date().toISOString();
    dep.nomAnnulateur = `${user.prenom} ${user.nom}`;

    localStorage.setItem(STORAGE_KEYS.DEPENSES, JSON.stringify(list));
    this.logAudit('DEPENSE_ANNULEE', 'Depense', idDepense, null, null, motif);
  }

  // ---------------- RETOURS / RETOUCHES ----------------
  public getRetours(): Retour[] {
    const raw = localStorage.getItem(STORAGE_KEYS.RETOURS);
    return raw ? JSON.parse(raw) : [];
  }

  public saveRetour(data: Partial<Retour>): Retour {
    if (!data.idCommande || !data.idPieceCommande) throw new Error('Veuillez sélectionner une commande et une pièce.');
    if (!data.descriptionProbleme?.trim()) throw new Error('La description du problème est obligatoire.');

    const user = this.getCurrentUser();
    if (!user) throw new Error('Session expirée.');

    const cmd = this.getCommandeById(data.idCommande);
    const piece = cmd?.pieces.find(p => p.idPieceCommande === data.idPieceCommande);
    if (!piece) throw new Error('Pièce introuvable.');

    const list = this.getRetours();
    const nextId = Math.max(0, ...list.map(r => r.idRetour)) + 1;

    const retour: Retour = {
      idRetour: nextId,
      idCommande: data.idCommande,
      idPieceCommande: data.idPieceCommande,
      idCouturier: piece.idCouturier || 0,
      idCouturierReprise: data.idCouturierReprise || piece.idCouturier,
      descriptionProbleme: data.descriptionProbleme.trim(),
      cheminPhotoDefaut: data.cheminPhotoDefaut,
      statut: 'Signale',
      dateSignalement: new Date().toISOString().split('T')[0],
      dateRdvReprise: data.dateRdvReprise,
      heureDebutReprise: data.heureDebutReprise,
      idOperateurEnregistrement: user.idEmploye,
      nomOperateurEnregistrement: `${user.prenom} ${user.nom}`,
      estAnnule: false,
    };

    list.unshift(retour);
    localStorage.setItem(STORAGE_KEYS.RETOURS, JSON.stringify(list));
    this.logAudit('RETOUR_AJOUTE', 'Retour', nextId, null, retour, 'Signalement de retouche');
    return retour;
  }

  public updateRetourStatut(idRetour: number, statut: Retour['statut']) {
    const list = this.getRetours();
    const ret = list.find(r => r.idRetour === idRetour);
    if (!ret) throw new Error('Retour introuvable.');

    const user = this.getCurrentUser();
    ret.statut = statut;
    if (statut === 'Rendu') {
      ret.dateResolution = new Date().toISOString();
      if (user) {
        ret.idOperateurResolution = user.idEmploye;
        ret.nomOperateurResolution = `${user.prenom} ${user.nom}`;
      }
    }
    localStorage.setItem(STORAGE_KEYS.RETOURS, JSON.stringify(list));
  }

  // ---------------- TRESORERIE & BILAN ----------------
  public calculerBilan(dateDebut: string, dateFin: string): BilanFinancier {
    const paiements = this.getPaiements().filter(
      p => !p.estAnnule && p.datePaiement.split('T')[0] >= dateDebut && p.datePaiement.split('T')[0] <= dateFin
    );
    const ca = paiements.reduce((s, p) => s + p.montantPaye, 0);

    const depenses = this.getDepenses().filter(
      d => !d.estAnnulee && d.statutValidation === 'Validee' && d.dateDepense >= dateDebut && d.dateDepense <= dateFin
    );
    const totalDepenses = depenses.reduce((s, d) => s + d.montant, 0);

    const commissions = this.getCommissions().filter(
      c => !c.estAnnulee && c.dateCalcul.split('T')[0] >= dateDebut && c.dateCalcul.split('T')[0] <= dateFin
    );
    const totalCommissions = commissions.reduce((s, c) => s + c.montantCommission, 0);
    const totalPrimesQualite = commissions.reduce((s, c) => s + (c.primeQualite || 0), 0);

    const commandes = this.getCommandes().filter(
      c => !c.estSupprimee && c.dateFin >= dateDebut && c.dateFin <= dateFin
    );

    let caCouture = 0;
    let caMateriaux = 0;
    let resteAEncaisser = 0;

    commandes.forEach(cmd => {
      const couture = cmd.pieces.reduce((s, p) => s + p.montantCouture, 0);
      const mat = (cmd.materielSupplements || []).reduce((s, m) => s + m.montant, 0);
      caCouture += couture;
      caMateriaux += mat;

      const encaisse = (cmd.paiements || []).filter(p => !p.estAnnule).reduce((s, p) => s + p.montantPaye, 0);
      const reste = couture + mat - encaisse;
      if (reste > 0) resteAEncaisser += reste;
    });

    const bilanNet = ca - totalDepenses - totalCommissions - totalPrimesQualite;

    return {
      dateDebut,
      dateFin,
      chiffreAffaires: ca,
      chiffreAffairesCouture: caCouture,
      chiffreAffairesMateriaux: caMateriaux,
      totalDepenses,
      totalCommissions,
      totalPrimesQualite,
      bilanNet,
      nombrePaiements: paiements.length,
      nombreCommandesLivrees: commandes.filter(c => c.pieces.some(p => p.statut === 'Livree')).length,
      resteAEncaisser,
    };
  }

  // ---------------- TYPES VETEMENTS ----------------
  public getTypeVetements(): TypeVetementConfig[] {
    const raw = localStorage.getItem(STORAGE_KEYS.TYPES_VETEMENTS);
    return raw ? JSON.parse(raw) : DEFAULT_TYPES_VETEMENTS;
  }

  public saveTypeVetement(type: TypeVetementConfig) {
    const list = this.getTypeVetements();
    const idx = list.findIndex(t => t.id === type.id);
    if (idx >= 0) {
      list[idx] = type;
    } else {
      list.push(type);
    }
    localStorage.setItem(STORAGE_KEYS.TYPES_VETEMENTS, JSON.stringify(list));
  }

  // ---------------- PARAMETRES ----------------
  public getParametres(): ParametresApp {
    const raw = localStorage.getItem(STORAGE_KEYS.PARAMETRES);
    return raw ? JSON.parse(raw) : DEFAULT_PARAMETRES;
  }

  public saveParametres(params: ParametresApp) {
    localStorage.setItem(STORAGE_KEYS.PARAMETRES, JSON.stringify(params));
  }

  // ---------------- AUDIT ----------------
  public getAuditLogs(): JournalAudit[] {
    const raw = localStorage.getItem(STORAGE_KEYS.AUDIT);
    return raw ? JSON.parse(raw) : [];
  }

  private async logAudit(
    typeAction: string,
    entite: string,
    idEntite: number,
    valeursAvant: unknown,
    valeursApres: unknown,
    motif?: string
  ) {
    const logs = this.getAuditLogs();
    const user = this.getCurrentUser();
    const previousHash = logs.length > 0 ? logs[0].hashCourant : '0000000000000000000000000000000000000000000000000000000000000000';
    const nowUtc = new Date().toISOString();

    const strAvant = valeursAvant ? JSON.stringify(valeursAvant) : '';
    const strApres = valeursApres ? JSON.stringify(valeursApres) : '';

    const payload = `${nowUtc}|${user?.idEmploye || 0}|${user ? `${user.prenom} ${user.nom}` : 'Système'}|${user?.role || 'System'}|${typeAction}|${entite}|${idEntite}|${strAvant}|${strApres}|${motif || ''}|${previousHash}`;
    const hashCourant = await sha256(payload);

    const logEntry: JournalAudit = {
      idJournal: logs.length + 1,
      dateHeureUtc: nowUtc,
      idOperateur: user?.idEmploye || 0,
      nomOperateur: user ? `${user.prenom} ${user.nom}` : 'Système',
      roleOperateur: user?.role || 'System',
      typeAction,
      entite,
      idEntite,
      valeursAvant: strAvant || undefined,
      valeursApres: strApres || undefined,
      motif,
      hashPrecedent: previousHash,
      hashCourant,
    };

    logs.unshift(logEntry);
    localStorage.setItem(STORAGE_KEYS.AUDIT, JSON.stringify(logs.slice(0, 500))); // Keep last 500
  }

  // ---------------- BACKUP & RESTORE ----------------
  public exportBackup(): string {
    const backup = {
      version: '2.0',
      exportedAt: new Date().toISOString(),
      employes: this.getEmployes(),
      clients: this.getClients(),
      commandes: this.getCommandes(),
      paiements: this.getPaiements(),
      commissions: this.getCommissions(),
      depenses: this.getDepenses(),
      retours: this.getRetours(),
      audit: this.getAuditLogs(),
      typesVetements: this.getTypeVetements(),
      parametres: this.getParametres(),
    };
    return JSON.stringify(backup, null, 2);
  }

  public importBackup(jsonString: string) {
    const data = JSON.parse(jsonString);
    if (!data.clients || !data.commandes || !data.employes) {
      throw new Error('Format de fichier de sauvegarde invalide.');
    }
    localStorage.setItem(STORAGE_KEYS.EMPLOYES, JSON.stringify(data.employes));
    localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(data.clients));
    localStorage.setItem(STORAGE_KEYS.COMMANDES, JSON.stringify(data.commandes));
    localStorage.setItem(STORAGE_KEYS.PAIEMENTS, JSON.stringify(data.paiements || []));
    localStorage.setItem(STORAGE_KEYS.COMMISSIONS, JSON.stringify(data.commissions || []));
    localStorage.setItem(STORAGE_KEYS.DEPENSES, JSON.stringify(data.depenses || []));
    localStorage.setItem(STORAGE_KEYS.RETOURS, JSON.stringify(data.retours || []));
    localStorage.setItem(STORAGE_KEYS.AUDIT, JSON.stringify(data.audit || []));
    if (data.typesVetements) localStorage.setItem(STORAGE_KEYS.TYPES_VETEMENTS, JSON.stringify(data.typesVetements));
    if (data.parametres) localStorage.setItem(STORAGE_KEYS.PARAMETRES, JSON.stringify(data.parametres));
  }
}

export const db = new StorageService();
