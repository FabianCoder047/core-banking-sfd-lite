package com.sfd.operation;

import com.sfd.agence.Agence;
import com.sfd.common.security.AuthPrincipal;
import com.sfd.credit.Credit;
import com.sfd.epargne.CompteEpargne;
import com.sfd.utilisateur.UtilisateurRepository;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;

@Component
public class OperationFactory {

    private static final DateTimeFormatter FORMAT_JOUR = DateTimeFormatter.BASIC_ISO_DATE;

    private final OperationRepository operationRepository;
    private final UtilisateurRepository utilisateurRepository;

    public OperationFactory(OperationRepository operationRepository,
                            UtilisateurRepository utilisateurRepository) {
        this.operationRepository = operationRepository;
        this.utilisateurRepository = utilisateurRepository;
    }

    public Operation creer(TypeOperation type, Agence agence, CompteEpargne compte,
                           Credit credit, BigDecimal montant, AuthPrincipal principal) {
        Operation operation = new Operation();
        operation.setReference(String.format("OP-%s-%06d",
                LocalDate.now(ZoneOffset.UTC).format(FORMAT_JOUR),
                operationRepository.prochainNumeroSequence()));
        operation.setType(type);
        operation.setAgence(agence);
        operation.setCompte(compte);
        operation.setCredit(credit);
        operation.setMontant(montant);
        operation.setDateOperation(Instant.now());
        operation.setUtilisateur(utilisateurRepository.getReferenceById(principal.id()));
        return operation;
    }
}
