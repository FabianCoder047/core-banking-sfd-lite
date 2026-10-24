export type Role = 'ADMIN' | 'DIRECTEUR' | 'AGENT_CREDIT' | 'CAISSIER' | 'COMPTABLE';
export type StatutCredit = 'DEMANDE' | 'APPROUVE' | 'REJETE' | 'DECAISSE' | 'SOLDE';
export type StatutEcheance = 'A_PAYER' | 'PARTIEL' | 'PAYE';
export type TypeOperation =
  'DEPOT' | 'RETRAIT' | 'DECAISSEMENT' | 'REMBOURSEMENT' | 'FRAIS_DOSSIER';
export type ModeAmortissement = 'ANNUITE_CONSTANTE' | 'CAPITAL_CONSTANT';
export type TypeCompte = 'ACTIF' | 'PASSIF' | 'CHARGE' | 'PRODUIT';
export type Journal = 'CAISSE' | 'CREDIT' | 'OD';
export type StatutCompte = 'ACTIF' | 'BLOQUE' | 'CLOTURE';

export interface Utilisateur {
  id: number;
  email: string;
  nom: string;
  prenom: string;
  role: Role;
  agenceId: number | null;
  agenceNom?: string;
  actif: boolean;
  doitChangerMotDePasse?: boolean;
  creeLe?: string;
}

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  utilisateur: Utilisateur;
}

export interface Agence {
  id: number;
  code: string;
  nom: string;
  ville?: string;
  active: boolean;
}

export interface Client {
  id: number;
  numero: string;
  nom: string;
  prenom: string;
  dateNaissance?: string;
  sexe?: string;
  telephone?: string;
  adresse?: string;
  profession?: string;
  numeroPiece?: string;
  statut: string;
  agenceId: number;
  agenceCode: string;
  creeLe?: string;
}

export interface CompteEpargne {
  id: number;
  numero: string;
  solde: number;
  statut: 'ACTIF' | 'BLOQUE' | 'CLOTURE';
  ouvertLe?: string;
  clientId: number;
  clientNomComplet: string;
  agenceId: number;
  agenceCode: string;
}

export interface Operation {
  id: number;
  reference: string;
  type: TypeOperation;
  montant: number;
  dateOperation: string;
  compteId?: number;
  creditId?: number;
  utilisateurId: number;
  extourneDe?: number;
}

export interface PageResponse<T> {
  contenu: T[];
  page: number;
  taille: number;
  total: number;
}

export interface AuditEvenement {
  id: number;
  categorie: 'SECURITE' | 'METIER';
  action: string;
  acteurId: number | null;
  acteurEmail: string | null;
  acteurRole: Role | null;
  agenceId: number | null;
  methode: string;
  chemin: string;
  statutHttp: number;
  adresseIp: string | null;
  creeLe: string;
}

export interface ProduitCredit {
  id: number;
  code: string;
  libelle: string;
  tauxAnnuel: number;
  dureeMinMois: number;
  dureeMaxMois: number;
  montantMin: number;
  montantMax: number;
  fraisDossierPct: number;
  modeAmortissement: ModeAmortissement;
  actif: boolean;
}

export interface Credit {
  id: number;
  numero: string;
  clientId: number;
  clientNomComplet: string;
  agenceId: number;
  agenceCode: string;
  produitId: number;
  produitLibelle: string;
  compteId: number;
  compteNumero: string;
  agentId: number;
  agentNomComplet: string;
  montantDemande: number;
  dureeMois: number;
  tauxAnnuel: number;
  fraisDossierPct: number;
  modeAmortissement: ModeAmortissement;
  statut: StatutCredit;
  motifRejet?: string;
  dateDemande: string;
  dateDecaissement?: string;
}

export interface Echeance {
  numero: number;
  dateEcheance: string;
  capitalDu: number;
  interetDu: number;
  capitalPaye: number;
  interetPaye: number;
  capitalRestant: number;
  interetRestant: number;
  statut: StatutEcheance;
}

export interface Echeancier {
  creditId: number;
  numero: string;
  montant: number;
  statut: StatutCredit;
  echeances: Echeance[];
  totalCapital: number;
  totalInteret: number;
  totalPaye: number;
  totalRestant: number;
}

export interface Remboursement {
  operationId: number;
  reference: string;
  montant: number;
  partCapital: number;
  partInteret: number;
  montantRestantDu: number;
  statutCredit: StatutCredit;
  dateOperation: string;
  echeances: Echeance[];
}

export interface ClientFiche {
  client: Client;
  comptes: CompteEpargne[];
  credits: Credit[];
}

export interface RepartitionStatut {
  statut: StatutCredit;
  nombre: number;
}

export interface FluxMensuel {
  mois: string;
  collecte: number;
  decaissements: number;
  remboursements: number;
}

export interface AgenceStat {
  agenceId: number;
  code: string;
  nom: string;
  clients: number;
  epargne: number;
  credit: number;
  demandes: number;
}

export interface Dashboard {
  nombreClients: number;
  encoursEpargne: number;
  encoursCredit: number;
  creditsEnAttente: number;
  creditsDecaisses: number;
  comptesActifs: number;
  echeancesEnRetard: number;
  montantImpaye: number;
  agenceId?: number;
  repartitionCredits: RepartitionStatut[];
  fluxMensuels: FluxMensuel[];
  agences: AgenceStat[];
}

export interface BalanceLigne {
  numero: string;
  libelle: string;
  type: TypeCompte;
  totalDebit: number;
  totalCredit: number;
  soldeDebit: number;
  soldeCredit: number;
}

export interface Balance {
  du: string;
  au: string;
  agenceId?: number;
  lignes: BalanceLigne[];
  totalDebit: number;
  totalCredit: number;
  equilibree: boolean;
}

export interface GrandLivreLigne {
  ecritureId: number;
  dateComptable: string;
  journal: string;
  libelle: string;
  sens: 'D' | 'C';
  debit: number;
  credit: number;
  soldeProgressif: number;
}

export interface GrandLivre {
  compte: string;
  libelle: string;
  du: string;
  au: string;
  lignes: GrandLivreLigne[];
  totalDebit: number;
  totalCredit: number;
  solde: number;
}

export interface CompteComptable {
  id: number;
  numero: string;
  libelle: string;
  type: TypeCompte;
}

export interface UtilisateurRequest {
  email: string;
  nom: string;
  prenom: string;
  role: Role;
  agenceId: number | null;
  actif: boolean;
}

export interface ClientRequest {
  nom: string;
  prenom: string;
  dateNaissance?: string | null;
  sexe?: string | null;
  telephone?: string | null;
  adresse?: string | null;
  profession?: string | null;
  numeroPiece?: string | null;
  agenceId?: number | null;
}

export interface AgenceRequest {
  code: string;
  nom: string;
  ville?: string | null;
  active: boolean;
}

export interface ProduitCreditRequest {
  code: string;
  libelle: string;
  tauxAnnuel: number;
  dureeMinMois: number;
  dureeMaxMois: number;
  montantMin: number;
  montantMax: number;
  fraisDossierPct: number;
  modeAmortissement: ModeAmortissement;
  actif: boolean;
}

export interface EcritureLigne {
  id: number;
  compteNumero: string;
  compteLibelle: string;
  sens: 'D' | 'C';
  montant: number;
}

export interface Ecriture {
  id: number;
  journal: Journal;
  libelle: string;
  dateComptable: string;
  agenceId: number;
  operationId?: number;
  extourneDe?: number;
  creeLe: string;
  lignes: EcritureLigne[];
}

export interface CompteComptableRequest {
  numero: string;
  libelle: string;
  type: TypeCompte;
}
