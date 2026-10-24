package com.sfd.common.security;

import com.sfd.common.error.BusinessException;
import org.springframework.http.HttpStatus;

/**
 * Regles transversales de filtrage par agence (section 4 du cahier des charges).
 * ADMIN et DIRECTEUR ont une vue consolidee et peuvent filtrer sur une agence.
 */
public final class AccesAgence {

    private AccesAgence() {
    }

    /** Agence effective pour une lecture : filtre optionnel pour les roles globaux, sinon agence du JWT. */
    public static Long agenceEffective(AuthPrincipal principal, Long agenceIdDemandee) {
        if (principal.isGlobal()) {
            return agenceIdDemandee;
        }
        return principal.agenceId();
    }

    /** Verifie qu'un role non global accede bien a une ressource de son agence. 404 pour ne rien divulguer. */
    public static void verifier(AuthPrincipal principal, Long agenceRessource) {
        if (principal.isGlobal()) {
            return;
        }
        if (principal.agenceId() == null || !principal.agenceId().equals(agenceRessource)) {
            throw BusinessException.notFound("RESSOURCE_INTROUVABLE", "Ressource introuvable.");
        }
    }

    /** Agence de creation : ADMIN/DIRECTEUR peuvent cibler une agence, les autres utilisent la leur. */
    public static Long agenceCreation(AuthPrincipal principal, Long agenceIdDemandee) {
        if (principal.isGlobal() && agenceIdDemandee != null) {
            return agenceIdDemandee;
        }
        if (principal.agenceId() == null) {
            throw new BusinessException("AGENCE_ABSENTE", HttpStatus.BAD_REQUEST,
                    "Aucune agence n'est associee a votre compte.");
        }
        return principal.agenceId();
    }
}
