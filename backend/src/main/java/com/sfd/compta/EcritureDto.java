package com.sfd.compta;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

public record EcritureDto(
        Long id,
        Journal journal,
        String libelle,
        LocalDate dateComptable,
        Long agenceId,
        Long operationId,
        Long extourneDe,
        Instant creeLe,
        List<LigneEcritureDto> lignes) {

    public static EcritureDto from(Ecriture ecriture) {
        return new EcritureDto(
                ecriture.getId(),
                ecriture.getJournal(),
                ecriture.getLibelle(),
                ecriture.getDateComptable(),
                ecriture.getAgence().getId(),
                ecriture.getOperation() == null ? null : ecriture.getOperation().getId(),
                ecriture.getExtourneDe() == null ? null : ecriture.getExtourneDe().getId(),
                ecriture.getCreeLe(),
                ecriture.getLignes().stream().map(LigneEcritureDto::from).toList());
    }
}
