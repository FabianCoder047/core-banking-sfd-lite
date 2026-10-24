-- Immutabilite comptable (RG-14) : aucune ecriture ni ligne d'ecriture ne peut etre
-- modifiee ou supprimee. Les corrections se font par extourne (nouvelle ecriture).
CREATE OR REPLACE FUNCTION interdire_modification_comptable()
RETURNS trigger AS $$
BEGIN
    RAISE EXCEPTION 'ECRITURE_IMMUABLE: les ecritures comptables sont immuables (operation %, table %)',
        TG_OP, TG_TABLE_NAME
        USING ERRCODE = 'P0001';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_ecriture_immutable
    BEFORE UPDATE OR DELETE ON ecriture
    FOR EACH ROW EXECUTE FUNCTION interdire_modification_comptable();

CREATE TRIGGER trg_ligne_ecriture_immutable
    BEFORE UPDATE OR DELETE ON ligne_ecriture
    FOR EACH ROW EXECUTE FUNCTION interdire_modification_comptable();

-- Index de performance.
CREATE INDEX idx_utilisateur_agence ON utilisateur(agence_id);
CREATE INDEX idx_client_agence ON client(agence_id);
CREATE INDEX idx_compte_epargne_agence ON compte_epargne(agence_id);
CREATE INDEX idx_compte_epargne_client ON compte_epargne(client_id);
CREATE INDEX idx_credit_client ON credit(client_id);
CREATE INDEX idx_credit_agence ON credit(agence_id);
CREATE INDEX idx_credit_statut ON credit(agence_id, statut);
CREATE INDEX idx_echeance_credit_date ON echeance(credit_id, date_echeance);
CREATE INDEX idx_operation_agence ON operation(agence_id);
CREATE INDEX idx_operation_compte ON operation(compte_id);
CREATE INDEX idx_operation_credit ON operation(credit_id);
CREATE INDEX idx_ecriture_agence ON ecriture(agence_id);
CREATE INDEX idx_ecriture_date ON ecriture(date_comptable);
CREATE INDEX idx_ecriture_operation ON ecriture(operation_id);
CREATE INDEX idx_ligne_ecriture_ecriture ON ligne_ecriture(ecriture_id);
CREATE INDEX idx_ligne_ecriture_compte ON ligne_ecriture(compte_comptable_id);

-- Sequences utilisees pour numeroter clients, comptes, credits et operations.
CREATE SEQUENCE client_numero_seq START 1;
CREATE SEQUENCE compte_numero_seq START 1;
CREATE SEQUENCE credit_numero_seq START 1;
CREATE SEQUENCE operation_ref_seq START 1;
