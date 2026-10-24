package com.sfd.credit;

import java.math.BigDecimal;
import java.time.LocalDate;

public record EcheanceDto(
        int numero,
        LocalDate dateEcheance,
        BigDecimal capitalDu,
        BigDecimal interetDu,
        BigDecimal capitalPaye,
        BigDecimal interetPaye,
        BigDecimal capitalRestant,
        BigDecimal interetRestant,
        StatutEcheance statut) {

    public static EcheanceDto from(Echeance echeance) {
        return new EcheanceDto(
                echeance.getNumero(),
                echeance.getDateEcheance(),
                echeance.getCapitalDu(),
                echeance.getInteretDu(),
                echeance.getCapitalPaye(),
                echeance.getInteretPaye(),
                echeance.capitalRestant(),
                echeance.interetRestant(),
                echeance.getStatut());
    }
}
