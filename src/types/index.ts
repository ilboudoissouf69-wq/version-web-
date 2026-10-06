export type RoleEmploye = 'Boss' | 'Secretaire' | 'Couturier';

export interface Employe {
  idEmploye: number;
  nom: string;
  prenom: string;
  identifiant: string;
  motDePasse: string;
  role: RoleEmploye;
  statut: 'Actif' | 'Suspendu';
  derniereModificationMotDePasse?: string;
}

export interface Client {
  idClient: number;
  nom: string;
  prenom: string;
  telephone: string;
  dateCreation: string;
}

export interface Mesure {
  nomMesure: string;
  valeur: string;
}

export interface MaterielSupplement {
  idMateriel: number;
  idPieceCommande?: number;
  designation: string;
  quantite: number;
  prixUnitaire: number;
  montant: number;
}

export interface PieceCommande {
  idPieceCommande: number;
  idCommande: number;
  typeVetement: string;
  descriptionPrecision: string;
  cheminPhoto?: string;
  idCouturier?: number;
  couturierNom?: string;
  montantCouture: number;
  statut: 'A faire' | 'En cours' | 'Terminee' | 'Livree';
  mesures: Mesure[];
  materielSupplements: MaterielSupplement[];
  rendezVousException?: string;
  idCommission?: number;
  motifAjoutApresEncaissement?: string;
}

export interface Commande {
  idCommande: number;
  idClient: number;
  client?: Client;
  dateDebut: string;
  dateFin: string;
  heureDebut?: string;
  heureFin?: string;
  statut?: string;
  pieces: PieceCommande[];
  paiements: Paiement[];
  materielSupplements: MaterielSupplement[];
  idOperateurCreation: number;
  nomOperateurCreation: string;
  dateCreation: string;
  estSupprimee: boolean;
  motifSuppression?: string;
  dateSuppression?: string;
  idOperateurSuppression?: number;
  nomOperateurSuppression?: string;
}

export interface Paiement {
  idPaiement: number;
  idCommande: number;
  montantPaye: number;
  datePaiement: string;
  modePaiement: 'Especes' | 'Mobile Money' | 'Virement' | 'Cheque';
  recuNumero: string;
  idOperateur: number;
  nomOperateur: string;
  estAnnule: boolean;
  motifsAnnulation?: string;
  dateAnnulation?: string;
  nomAnnulateur?: string;
  montantTotalCommande: number;
  resteAvantPaiement: number;
}

export interface Commission {
  idCommission: number;
  idEmploye: number;
  nomEmployeSnapshot: string;
  dateDebutPeriode: string;
  dateFinPeriode: string;
  baseCalcul: 'Encaisse' | 'Total';
  pourcentage: number;
  baseMontant: number;
  montantCommission: number;
  primeQualite: number;
  nbCommandes: number;
  dateCalcul: string;
  idOperateur: number;
  nomOperateur: string;
  estAnnulee: boolean;
  motifAnnulation?: string;
  dateAnnulation?: string;
  nomAnnulateur?: string;
  piecesIds: number[];
}

export interface Depense {
  idDepense: number;
  categorie: 'Charges fixes' | 'Masse salariale' | 'Matériel & Entretien' | 'Divers';
  typeDepense: string;
  montant: number;
  dateDepense: string;
  description: string;
  idOperateur: number;
  nomOperateur: string;
  statutValidation: 'En attente' | 'Validee';
  estAnnulee: boolean;
  motifAnnulation?: string;
  dateAnnulation?: string;
  nomAnnulateur?: string;
}

export interface Retour {
  idRetour: number;
  idCommande: number;
  idPieceCommande: number;
  idCouturier: number;
  idCouturierReprise?: number;
  descriptionProbleme: string;
  cheminPhotoDefaut?: string;
  statut: 'Signale' | 'En reprise' | 'Pret' | 'Rendu';
  dateSignalement: string;
  dateRdvReprise?: string;
  heureDebutReprise?: string;
  heureFinReprise?: string;
  dateResolution?: string;
  idOperateurEnregistrement: number;
  nomOperateurEnregistrement: string;
  idOperateurResolution?: number;
  nomOperateurResolution?: string;
  estAnnule: boolean;
  motifAnnulation?: string;
  dateAnnulation?: string;
  nomAnnulateur?: string;
}

export interface JournalAudit {
  idJournal: number;
  dateHeureUtc: string;
  idOperateur: number;
  nomOperateur: string;
  roleOperateur: string;
  typeAction: string;
  entite: string;
  idEntite: number;
  valeursAvant?: string;
  valeursApres?: string;
  motif?: string;
  hashPrecedent?: string;
  hashCourant: string;
}

export interface TypeVetementConfig {
  id: string;
  nom: string;
  prixBase: number;
  descriptions: string[];
  mesuresRequises: string[];
}

export interface ParametresApp {
  nomAtelier: string;
  telephone: string;
  adresse: string;
  devise: string;
  delaiAlerteJours: number;
  pourcentageCommissionDefaut: number;
  messageCommandePrete: string;
  messageRappelRdv: string;
  noteRecu: string;
}

export interface ApercuCommissionItem {
  idEmploye: number;
  nom: string;
  nbCommandes: number;
  caTotal: number;
  caEncaisse: number;
  baseCalcul: number;
  commission: number;
  totalMateriaux: number;
  totalEncaisse: number;
  primeQualite: number;
  idsCommandes: number[];
  idsPieces: number[];
}

export interface BilanFinancier {
  dateDebut: string;
  dateFin: string;
  chiffreAffaires: number;
  chiffreAffairesCouture: number;
  chiffreAffairesMateriaux: number;
  totalDepenses: number;
  totalCommissions: number;
  totalPrimesQualite: number;
  bilanNet: number;
  nombrePaiements: number;
  nombreCommandesLivrees: number;
  resteAEncaisser: number;
}
