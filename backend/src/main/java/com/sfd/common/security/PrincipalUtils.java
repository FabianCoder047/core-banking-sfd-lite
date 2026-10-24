package com.sfd.common.security;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

public final class PrincipalUtils {

    private PrincipalUtils() {
    }

    public static AuthPrincipal current() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof AuthPrincipal principal)) {
            throw new IllegalStateException("Aucun utilisateur authentifie dans le contexte");
        }
        return principal;
    }
}
