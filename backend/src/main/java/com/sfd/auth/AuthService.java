package com.sfd.auth;

import com.sfd.audit.AuditService;
import com.sfd.common.error.BusinessException;
import com.sfd.common.security.AuthPrincipal;
import com.sfd.common.security.JwtService;
import com.sfd.utilisateur.Utilisateur;
import com.sfd.utilisateur.UtilisateurDto;
import com.sfd.utilisateur.UtilisateurRepository;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;
import java.util.Optional;

@Service
public class AuthService {

    private final UtilisateurRepository utilisateurRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuditService auditService;

    public AuthService(UtilisateurRepository utilisateurRepository,
                       PasswordEncoder passwordEncoder,
                       JwtService jwtService,
                       AuditService auditService) {
        this.utilisateurRepository = utilisateurRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.auditService = auditService;
    }

    @Transactional(readOnly = true)
    public TokenResponse login(LoginRequest request, String adresseIp) {
        String email = request.email().trim().toLowerCase(Locale.ROOT);
        Optional<Utilisateur> resultat = utilisateurRepository.findByEmailIgnoreCase(email);
        if (resultat.isEmpty()) {
            auditService.enregistrerConnexionEchouee(email, adresseIp);
            throw identifiantsInvalides();
        }
        Utilisateur utilisateur = resultat.get();
        if (!utilisateur.isActif() || !passwordEncoder.matches(request.motDePasse(), utilisateur.getMotDePasseHash())) {
            auditService.enregistrerConnexionEchouee(
                    utilisateur.getId(), utilisateur.getEmail(), utilisateur.getRole().name(),
                    utilisateur.getAgence() == null ? null : utilisateur.getAgence().getId(), adresseIp);
            throw identifiantsInvalides();
        }
        auditService.enregistrerConnexionReussie(
                utilisateur.getId(), utilisateur.getEmail(), utilisateur.getRole().name(),
                utilisateur.getAgence() == null ? null : utilisateur.getAgence().getId(), adresseIp);
        return tokens(utilisateur);
    }

    @Transactional(readOnly = true)
    public TokenResponse refresh(RefreshRequest request) {
        try {
            Claims claims = jwtService.parse(request.refreshToken());
            if (!JwtService.TYPE_REFRESH.equals(claims.get("type", String.class))) {
                throw identifiantsInvalides();
            }
            Utilisateur utilisateur = utilisateurRepository.findById(Long.valueOf(claims.getSubject()))
                    .filter(Utilisateur::isActif)
                    .orElseThrow(this::identifiantsInvalides);
            return tokens(utilisateur);
        } catch (JwtException | IllegalArgumentException ex) {
            throw new BusinessException("JETON_INVALIDE", HttpStatus.UNAUTHORIZED,
                    "Le jeton de rafraichissement est invalide ou expire.");
        }
    }

    @Transactional
    public TokenResponse changerMotDePasse(AuthPrincipal principal, ChangerMotDePasseRequest request) {
        Utilisateur utilisateur = utilisateurRepository.findById(principal.id())
                .filter(Utilisateur::isActif)
                .orElseThrow(this::identifiantsInvalides);
        if (!passwordEncoder.matches(request.motDePasseActuel(), utilisateur.getMotDePasseHash())) {
            throw new BusinessException("MOT_DE_PASSE_ACTUEL_INCORRECT",
                    "Le mot de passe actuel est incorrect.");
        }
        if (passwordEncoder.matches(request.nouveauMotDePasse(), utilisateur.getMotDePasseHash())) {
            throw new BusinessException("MOT_DE_PASSE_IDENTIQUE",
                    "Le nouveau mot de passe doit etre different du mot de passe temporaire.");
        }
        utilisateur.setMotDePasseHash(passwordEncoder.encode(request.nouveauMotDePasse()));
        utilisateur.setDoitChangerMotDePasse(false);
        return tokens(utilisateur);
    }

    private TokenResponse tokens(Utilisateur utilisateur) {
        return new TokenResponse(
                jwtService.generateAccessToken(utilisateur),
                jwtService.generateRefreshToken(utilisateur),
                jwtService.accessTtlSeconds(),
                UtilisateurDto.from(utilisateur));
    }

    private BusinessException identifiantsInvalides() {
        return new BusinessException("IDENTIFIANTS_INVALIDES", HttpStatus.UNAUTHORIZED,
                "Email ou mot de passe incorrect.");
    }
}
