package com.sfd.utilisateur;

import com.sfd.agence.Agence;
import com.sfd.agence.AgenceRepository;
import com.sfd.common.api.PageResponse;
import com.sfd.common.email.EmailService;
import com.sfd.common.error.BusinessException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;

@Service
public class UtilisateurService {

    private final UtilisateurRepository repository;
    private final AgenceRepository agenceRepository;
    private final PasswordEncoder passwordEncoder;
    private final GenerateurMotDePasse generateurMotDePasse;
    private final EmailService emailService;

    public UtilisateurService(UtilisateurRepository repository,
                              AgenceRepository agenceRepository,
                              PasswordEncoder passwordEncoder,
                              GenerateurMotDePasse generateurMotDePasse,
                              EmailService emailService) {
        this.repository = repository;
        this.agenceRepository = agenceRepository;
        this.passwordEncoder = passwordEncoder;
        this.generateurMotDePasse = generateurMotDePasse;
        this.emailService = emailService;
    }

    @Transactional(readOnly = true)
    public PageResponse<UtilisateurDto> lister(Long agenceId, Pageable pageable) {
        Page<Utilisateur> page = agenceId == null
                ? repository.findAll(pageable)
                : repository.findByAgenceId(agenceId, pageable);
        return PageResponse.from(page, UtilisateurDto::from);
    }

    @Transactional(readOnly = true)
    public UtilisateurDto obtenir(Long id) {
        return UtilisateurDto.from(charger(id));
    }

    @Transactional
    public UtilisateurDto creer(UtilisateurRequest request) {
        if (repository.existsByEmailIgnoreCase(request.email())) {
            throw new BusinessException("EMAIL_EXISTANT", "Un utilisateur avec cet email existe deja.");
        }
        Utilisateur utilisateur = new Utilisateur();
        appliquer(utilisateur, request);
        String motDePasseTemporaire = generateurMotDePasse.generer();
        utilisateur.setMotDePasseHash(passwordEncoder.encode(motDePasseTemporaire));
        utilisateur.setDoitChangerMotDePasse(true);
        Utilisateur enregistre = repository.saveAndFlush(utilisateur);
        emailService.envoyerMotDePasseInitial(
                enregistre.getEmail(), enregistre.getPrenom(), motDePasseTemporaire);
        return UtilisateurDto.from(enregistre);
    }

    @Transactional
    public UtilisateurDto modifier(Long id, UtilisateurRequest request) {
        Utilisateur utilisateur = charger(id);
        if (repository.existsByEmailIgnoreCaseAndIdNot(request.email(), id)) {
            throw new BusinessException("EMAIL_EXISTANT", "Un utilisateur avec cet email existe deja.");
        }
        appliquer(utilisateur, request);
        return UtilisateurDto.from(utilisateur);
    }

    @Transactional
    public void supprimer(Long id) {
        Utilisateur utilisateur = charger(id);
        utilisateur.setActif(false);
    }

    @Transactional(readOnly = true)
    public Utilisateur charger(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> BusinessException.notFound("UTILISATEUR_INTROUVABLE", "Utilisateur introuvable."));
    }

    private void appliquer(Utilisateur utilisateur, UtilisateurRequest request) {
        if (request.role() != Role.ADMIN && request.agenceId() == null) {
            throw new BusinessException("AGENCE_REQUISE", "Une agence est obligatoire pour ce role.");
        }
        Agence agence = null;
        if (request.agenceId() != null) {
            agence = agenceRepository.findById(request.agenceId())
                    .orElseThrow(() -> BusinessException.notFound("AGENCE_INTROUVABLE", "Agence introuvable."));
        }
        utilisateur.setEmail(request.email().trim().toLowerCase(Locale.ROOT));
        utilisateur.setNom(request.nom().trim());
        utilisateur.setPrenom(request.prenom().trim());
        utilisateur.setRole(request.role());
        utilisateur.setAgence(agence);
        utilisateur.setActif(request.actif() == null || request.actif());
    }
}
