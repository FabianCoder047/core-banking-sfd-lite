package com.sfd.operation;

import java.math.BigDecimal;
import java.time.Instant;

public record OperationDto(
        Long id,
        String reference,
        TypeOperation type,
        BigDecimal montant,
        Instant dateOperation,
        Long compteId,
        Long creditId,
        Long utilisateurId,
        Long extourneDe) {

    public static OperationDto from(Operation operation) {
        return new OperationDto(
                operation.getId(),
                operation.getReference(),
                operation.getType(),
                operation.getMontant(),
                operation.getDateOperation(),
                operation.getCompte() == null ? null : operation.getCompte().getId(),
                operation.getCredit() == null ? null : operation.getCredit().getId(),
                operation.getUtilisateur().getId(),
                operation.getExtourneDe() == null ? null : operation.getExtourneDe().getId());
    }
}
