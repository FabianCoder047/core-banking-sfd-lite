package com.sfd.audit;

import com.sfd.common.security.AuthPrincipal;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.lang.NonNull;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Set;

public final class AuditFilter extends OncePerRequestFilter {

    private static final Set<String> METHODES_ECRITURE = Set.of("POST", "PUT", "PATCH", "DELETE");
    private static final Set<String> CHEMINS_AUTHENTIFICATION = Set.of("/api/auth/login");

    private final AuditService auditService;

    public AuditFilter(AuditService auditService) {
        this.auditService = auditService;
    }

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                    @NonNull HttpServletResponse response,
                                    @NonNull FilterChain filterChain) throws ServletException, IOException {
        try {
            filterChain.doFilter(request, response);
        } catch (IOException | ServletException | RuntimeException ex) {
            if (!response.isCommitted()) {
                response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            }
            throw ex;
        } finally {
            String chemin = request.getRequestURI();
            if (chemin.startsWith("/api/")
                    && METHODES_ECRITURE.contains(request.getMethod().toUpperCase())
                    && !CHEMINS_AUTHENTIFICATION.contains(chemin)) {
                Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
                AuthPrincipal principal = authentication != null
                        && authentication.getPrincipal() instanceof AuthPrincipal authPrincipal
                        ? authPrincipal
                        : null;
                auditService.enregistrerRequete(request.getMethod(), chemin, response.getStatus(),
                        request.getRemoteAddr(), principal);
            }
        }
    }
}
