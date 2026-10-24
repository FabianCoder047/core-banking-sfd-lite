-- Donnees de demonstration. Mot de passe de tous les comptes : Sfd@2026!
INSERT INTO agence (code, nom, ville, active) VALUES
    ('AG001', 'Agence de Lome', 'Lome', TRUE),
    ('AG002', 'Agence de Kara', 'Kara', TRUE);

INSERT INTO utilisateur (agence_id, email, mot_de_passe_hash, nom, prenom, role, actif)
SELECT id, 'admin@sfd.tg', '$2b$10$QZzbgmN8oYBW2PaeLeXinOoP6WLD2MkC9wBRyPqzymbduTGIsBG1u', 'ADMIN', 'Systeme', 'ADMIN', TRUE FROM agence WHERE code = 'AG001';
INSERT INTO utilisateur (agence_id, email, mot_de_passe_hash, nom, prenom, role, actif)
SELECT id, 'directeur@sfd.tg', '$2b$10$QZzbgmN8oYBW2PaeLeXinOoP6WLD2MkC9wBRyPqzymbduTGIsBG1u', 'KOFFI', 'Ama', 'DIRECTEUR', TRUE FROM agence WHERE code = 'AG001';
INSERT INTO utilisateur (agence_id, email, mot_de_passe_hash, nom, prenom, role, actif)
SELECT id, 'agent@sfd.tg', '$2b$10$QZzbgmN8oYBW2PaeLeXinOoP6WLD2MkC9wBRyPqzymbduTGIsBG1u', 'MENSAH', 'Kodjo', 'AGENT_CREDIT', TRUE FROM agence WHERE code = 'AG001';
INSERT INTO utilisateur (agence_id, email, mot_de_passe_hash, nom, prenom, role, actif)
SELECT id, 'caissier@sfd.tg', '$2b$10$QZzbgmN8oYBW2PaeLeXinOoP6WLD2MkC9wBRyPqzymbduTGIsBG1u', 'ADJOVI', 'Rita', 'CAISSIER', TRUE FROM agence WHERE code = 'AG001';
INSERT INTO utilisateur (agence_id, email, mot_de_passe_hash, nom, prenom, role, actif)
SELECT id, 'comptable@sfd.tg', '$2b$10$QZzbgmN8oYBW2PaeLeXinOoP6WLD2MkC9wBRyPqzymbduTGIsBG1u', 'TCHALLA', 'Benoit', 'COMPTABLE', TRUE FROM agence WHERE code = 'AG001';

INSERT INTO compte_comptable (numero, libelle, type) VALUES
    ('101', 'Caisse', 'ACTIF'),
    ('201', 'Depots de la clientele (epargne)', 'PASSIF'),
    ('301', 'Credits a la clientele', 'ACTIF'),
    ('701', 'Produits d''interets sur credits', 'PRODUIT'),
    ('702', 'Frais et commissions de dossier', 'PRODUIT');

INSERT INTO produit_credit (code, libelle, taux_annuel, duree_min_mois, duree_max_mois, montant_min, montant_max, frais_dossier_pct, mode_amortissement, actif) VALUES
    ('SCOLAIRE', 'Credit scolaire', 12.000, 6, 12, 50000, 500000, 2.00, 'ANNUITE_CONSTANTE', TRUE),
    ('COMMERCE', 'Credit de commerce', 18.000, 3, 24, 100000, 5000000, 1.50, 'CAPITAL_CONSTANT', TRUE),
    ('URGENCE', 'Credit d''urgence', 24.000, 1, 6, 25000, 300000, 3.00, 'ANNUITE_CONSTANTE', TRUE);
