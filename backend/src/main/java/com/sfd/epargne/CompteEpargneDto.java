package com.sfd.epargne;

import java.math.BigDecimal;
import java.time.Instant;

public record CompteEpargneDto(
        Long id,
        String numero,
        BigDecimal solde,
        StatutCompte statut,
        Instant ouvertLe,
        Long clientId,
        String clientNomComplet,
        Long agenceId,
        String agenceCode) {

    public static CompteEpargneDto from(CompteEpargne compte) {
        return new CompteEpargneDto(
                compte.getId(),
                compte.getNumero(),
                compte.getSolde(),
                compte.getStatut(),
                compte.getOuvertLe(),
                compte.getClient().getId(),
                compte.getClient().getPrenom() + " " + compte.getClient().getNom(),
                compte.getAgence().getId(),
                compte.getAgence().getCode());
    }
}
