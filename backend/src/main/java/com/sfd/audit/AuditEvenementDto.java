package com.sfd.audit;

import java.time.Instant;

public record AuditEvenementDto(
        Long id,
        String categorie,
        String action,
        Long acteurId,
        String acteurEmail,
        String acteurRole,
        Long agenceId,
        String methode,
        String chemin,
        int statutHttp,
        String adresseIp,
        Instant creeLe) {

    public static AuditEvenementDto from(AuditEvenement evenement) {
        return new AuditEvenementDto(
                evenement.getId(),
                evenement.getCategorie(),
                evenement.getAction(),
                evenement.getActeurId(),
                evenement.getActeurEmail(),
                evenement.getActeurRole(),
                evenement.getAgenceId(),
                evenement.getMethode(),
                evenement.getChemin(),
                evenement.getStatutHttp(),
                evenement.getAdresseIp(),
                evenement.getCreeLe());
    }
}
