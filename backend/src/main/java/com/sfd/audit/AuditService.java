package com.sfd.audit;

import com.sfd.common.api.PageResponse;
import com.sfd.common.security.AuthPrincipal;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuditService {

    private static final String CATEGORIE_SECURITE = "SECURITE";
    private static final String CATEGORIE_METIER = "METIER";

    private final AuditEvenementRepository repository;

    public AuditService(AuditEvenementRepository repository) {
        this.repository = repository;
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void enregistrerConnexionReussie(Long acteurId, String email, String role, Long agenceId,
                                             String adresseIp) {
        enregistrer("CONNEXION_REUSSIE", "/api/auth/login", "POST", 200,
                acteurId, email, role, agenceId, adresseIp, CATEGORIE_SECURITE);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void enregistrerConnexionEchouee(String email, String adresseIp) {
        enregistrer("CONNEXION_ECHOUEE", "/api/auth/login", "POST", 401,
                null, email, null, null, adresseIp, CATEGORIE_SECURITE);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void enregistrerConnexionEchouee(Long acteurId, String email, String role, Long agenceId,
                                             String adresseIp) {
        enregistrer("CONNEXION_ECHOUEE", "/api/auth/login", "POST", 401,
                acteurId, email, role, agenceId, adresseIp, CATEGORIE_SECURITE);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void enregistrerRequete(String methode, String chemin, int statutHttp, String adresseIp,
                                   AuthPrincipal principal) {
        boolean authentification = chemin.startsWith("/api/auth/");
        String action = determinerAction(methode, chemin, statutHttp);
        String cheminAudite = chemin.length() <= 255 ? chemin : chemin.substring(0, 255);
        enregistrer(action, cheminAudite, methode, statutHttp,
                principal == null ? null : principal.id(),
                principal == null ? null : principal.email(),
                principal == null ? null : principal.role(),
                principal == null ? null : principal.agenceId(),
                adresseIp, authentification ? CATEGORIE_SECURITE : CATEGORIE_METIER);
    }

    private String determinerAction(String methode, String chemin, int statutHttp) {
        String action;
        if ("/api/auth/mot-de-passe".equals(chemin)) {
            action = statutHttp >= 200 && statutHttp < 300
                    ? "CHANGEMENT_MOT_DE_PASSE"
                    : "ECHEC_CHANGEMENT_MOT_DE_PASSE";
        } else if ("/api/auth/refresh".equals(chemin)) {
            action = statutHttp >= 200 && statutHttp < 300
                    ? "JETON_RENOUVELE"
                    : "ECHEC_RENOUVELLEMENT_JETON";
        } else {
            String dernierSegment = chemin.substring(chemin.lastIndexOf('/') + 1);
            action = switch (dernierSegment) {
                case "depots" -> "DEPOT";
                case "retraits" -> "RETRAIT";
                case "decaissement" -> "DECAISSEMENT";
                case "remboursements" -> "REMBOURSEMENT";
                case "approbation" -> "APPROBATION_CREDIT";
                case "extourne" -> "EXTOURNE";
                default -> "REQUETE_" + methode.toUpperCase();
            };
            if (statutHttp >= 400) {
                action = "ECHEC_" + action;
            }
        }
        return action;
    }

    @Transactional(readOnly = true)
    public PageResponse<AuditEvenementDto> lister(AuthPrincipal principal, Pageable pageable) {
        Page<AuditEvenement> page;
        if (principal.isAdmin()) {
            page = repository.findAllByOrderByCreeLeDesc(pageable);
        } else if (principal.agenceId() != null) {
            page = repository.findByAgenceIdOrderByCreeLeDesc(principal.agenceId(), pageable);
        } else {
            page = Page.empty(pageable);
        }
        return PageResponse.from(page, AuditEvenementDto::from);
    }

    private void enregistrer(String action, String chemin, String methode, int statutHttp,
                             Long acteurId, String acteurEmail, String acteurRole, Long agenceId,
                             String adresseIp, String categorie) {
        AuditEvenement evenement = new AuditEvenement();
        evenement.setCategorie(categorie);
        evenement.setAction(action);
        evenement.setActeurId(acteurId);
        evenement.setActeurEmail(acteurEmail);
        evenement.setActeurRole(acteurRole);
        evenement.setAgenceId(agenceId);
        evenement.setMethode(methode);
        evenement.setChemin(chemin);
        evenement.setStatutHttp(statutHttp);
        evenement.setAdresseIp(adresseIp);
        repository.save(evenement);
    }
}
