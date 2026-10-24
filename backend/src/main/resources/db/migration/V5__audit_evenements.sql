CREATE TABLE audit_evenement (
    id BIGSERIAL PRIMARY KEY,
    categorie VARCHAR(20) NOT NULL,
    action VARCHAR(60) NOT NULL,
    acteur_id BIGINT,
    acteur_email VARCHAR(150),
    acteur_role VARCHAR(20),
    agence_id BIGINT,
    methode VARCHAR(10) NOT NULL,
    chemin VARCHAR(255) NOT NULL,
    statut_http INT NOT NULL,
    adresse_ip VARCHAR(45),
    cree_le TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_evenement_agence_date
    ON audit_evenement (agence_id, cree_le DESC);

CREATE INDEX idx_audit_evenement_date
    ON audit_evenement (cree_le DESC);

CREATE OR REPLACE FUNCTION interdire_modification_audit()
RETURNS trigger AS $$
BEGIN
    RAISE EXCEPTION 'AUDIT_IMMUABLE: les evenements d''audit ne peuvent pas etre modifies ou supprimes'
        USING ERRCODE = 'P0001';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_audit_evenement_immutable
    BEFORE UPDATE OR DELETE ON audit_evenement
    FOR EACH ROW EXECUTE FUNCTION interdire_modification_audit();
