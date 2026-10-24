-- Schema initial du Core Banking SFD Lite (conforme au cahier des charges V1__init).
CREATE TABLE agence (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(10) NOT NULL UNIQUE,
    nom VARCHAR(100) NOT NULL,
    ville VARCHAR(100),
    active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE utilisateur (
    id BIGSERIAL PRIMARY KEY,
    agence_id BIGINT REFERENCES agence(id),
    email VARCHAR(150) NOT NULL UNIQUE,
    mot_de_passe_hash VARCHAR(100) NOT NULL,
    nom VARCHAR(80) NOT NULL,
    prenom VARCHAR(80) NOT NULL,
    role VARCHAR(20) NOT NULL,
    actif BOOLEAN NOT NULL DEFAULT TRUE,
    cree_le TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE client (
    id BIGSERIAL PRIMARY KEY,
    agence_id BIGINT NOT NULL REFERENCES agence(id),
    numero VARCHAR(20) NOT NULL UNIQUE,
    nom VARCHAR(80) NOT NULL,
    prenom VARCHAR(80) NOT NULL,
    date_naissance DATE,
    sexe CHAR(1) CHECK (sexe IN ('M','F')),
    telephone VARCHAR(20),
    adresse VARCHAR(255),
    profession VARCHAR(100),
    numero_piece VARCHAR(40),
    statut VARCHAR(15) NOT NULL DEFAULT 'ACTIF',
    cree_le TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE compte_epargne (
    id BIGSERIAL PRIMARY KEY,
    client_id BIGINT NOT NULL REFERENCES client(id),
    agence_id BIGINT NOT NULL REFERENCES agence(id),
    numero VARCHAR(20) NOT NULL UNIQUE,
    solde NUMERIC(18,0) NOT NULL DEFAULT 0 CHECK (solde >= 0),
    statut VARCHAR(10) NOT NULL DEFAULT 'ACTIF',
    ouvert_le TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE produit_credit (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(20) NOT NULL UNIQUE,
    libelle VARCHAR(100) NOT NULL,
    taux_annuel NUMERIC(6,3) NOT NULL,
    duree_min_mois INT NOT NULL,
    duree_max_mois INT NOT NULL,
    montant_min NUMERIC(18,0) NOT NULL,
    montant_max NUMERIC(18,0) NOT NULL,
    frais_dossier_pct NUMERIC(5,2) NOT NULL DEFAULT 0,
    mode_amortissement VARCHAR(20) NOT NULL,
    actif BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE credit (
    id BIGSERIAL PRIMARY KEY,
    numero VARCHAR(25) NOT NULL UNIQUE,
    client_id BIGINT NOT NULL REFERENCES client(id),
    agence_id BIGINT NOT NULL REFERENCES agence(id),
    produit_id BIGINT NOT NULL REFERENCES produit_credit(id),
    compte_id BIGINT NOT NULL REFERENCES compte_epargne(id),
    agent_id BIGINT NOT NULL REFERENCES utilisateur(id),
    montant_demande NUMERIC(18,0) NOT NULL CHECK (montant_demande > 0),
    duree_mois INT NOT NULL CHECK (duree_mois > 0),
    taux_annuel NUMERIC(6,3) NOT NULL,
    statut VARCHAR(12) NOT NULL DEFAULT 'DEMANDE',
    motif_rejet VARCHAR(255),
    date_demande DATE NOT NULL DEFAULT CURRENT_DATE,
    date_decaissement DATE
);

CREATE TABLE echeance (
    id BIGSERIAL PRIMARY KEY,
    credit_id BIGINT NOT NULL REFERENCES credit(id),
    numero INT NOT NULL,
    date_echeance DATE NOT NULL,
    capital_du NUMERIC(18,0) NOT NULL,
    interet_du NUMERIC(18,0) NOT NULL,
    capital_paye NUMERIC(18,0) NOT NULL DEFAULT 0,
    interet_paye NUMERIC(18,0) NOT NULL DEFAULT 0,
    statut VARCHAR(10) NOT NULL DEFAULT 'A_PAYER',
    UNIQUE (credit_id, numero)
);

CREATE TABLE operation (
    id BIGSERIAL PRIMARY KEY,
    reference VARCHAR(30) NOT NULL UNIQUE,
    type VARCHAR(20) NOT NULL,
    agence_id BIGINT NOT NULL REFERENCES agence(id),
    compte_id BIGINT REFERENCES compte_epargne(id),
    credit_id BIGINT REFERENCES credit(id),
    montant NUMERIC(18,0) NOT NULL CHECK (montant > 0),
    date_operation TIMESTAMPTZ NOT NULL DEFAULT now(),
    utilisateur_id BIGINT NOT NULL REFERENCES utilisateur(id),
    extourne_de BIGINT REFERENCES operation(id)
);

CREATE TABLE compte_comptable (
    id BIGSERIAL PRIMARY KEY,
    numero VARCHAR(10) NOT NULL UNIQUE,
    libelle VARCHAR(120) NOT NULL,
    type VARCHAR(10) NOT NULL
);

CREATE TABLE ecriture (
    id BIGSERIAL PRIMARY KEY,
    journal VARCHAR(10) NOT NULL,
    libelle VARCHAR(200) NOT NULL,
    date_comptable DATE NOT NULL,
    agence_id BIGINT NOT NULL REFERENCES agence(id),
    operation_id BIGINT REFERENCES operation(id),
    extourne_de BIGINT REFERENCES ecriture(id),
    cree_le TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE ligne_ecriture (
    id BIGSERIAL PRIMARY KEY,
    ecriture_id BIGINT NOT NULL REFERENCES ecriture(id),
    compte_comptable_id BIGINT NOT NULL REFERENCES compte_comptable(id),
    sens CHAR(1) NOT NULL CHECK (sens IN ('D','C')),
    montant NUMERIC(18,0) NOT NULL CHECK (montant > 0)
);
