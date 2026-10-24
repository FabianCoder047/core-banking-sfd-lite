-- Mot de passe temporaire genere lors de la creation d'un utilisateur.
-- Les comptes existants et les comptes de demonstration ne sont pas concernes.
ALTER TABLE utilisateur
    ADD COLUMN doit_changer_mot_de_passe BOOLEAN NOT NULL DEFAULT FALSE;
