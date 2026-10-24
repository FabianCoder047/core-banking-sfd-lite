package com.sfd.common.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.MediaType;
import org.springframework.lang.NonNull;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Map;
import java.util.Set;

/**
 * Bloque les appels API tant que l'utilisateur n'a pas remplace son mot de passe
 * temporaire. Seuls le changement de mot de passe et le rafraichissement restent accessibles.
 */
@Component
public class MotDePasseTemporaireFilter extends OncePerRequestFilter {

    private static final Set<String> CHEMINS_AUTORISES = Set.of(
            "/api/auth/mot-de-passe",
            "/api/auth/login",
            "/api/auth/refresh");

    private final ObjectMapper objectMapper;

    public MotDePasseTemporaireFilter(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                    @NonNull HttpServletResponse response,
                                    @NonNull FilterChain filterChain) throws ServletException, IOException {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null
                && authentication.getPrincipal() instanceof AuthPrincipal principal
                && principal.doitChangerMotDePasse()
                && !CHEMINS_AUTORISES.contains(request.getRequestURI())
                && !"OPTIONS".equalsIgnoreCase(request.getMethod())) {
            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
            response.setContentType(MediaType.APPLICATION_PROBLEM_JSON_VALUE);
            objectMapper.writeValue(response.getOutputStream(), Map.of(
                    "type", "urn:sfd:erreur:MOT_DE_PASSE_A_CHANGER",
                    "title", "Forbidden",
                    "status", HttpServletResponse.SC_FORBIDDEN,
                    "detail", "Vous devez changer votre mot de passe temporaire avant de continuer.",
                    "code", "MOT_DE_PASSE_A_CHANGER"));
            return;
        }
        filterChain.doFilter(request, response);
    }
}
