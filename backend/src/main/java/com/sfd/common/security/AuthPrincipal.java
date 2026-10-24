package com.sfd.common.security;

/**
 * Utilisateur authentifie extrait du JWT. Toute la tenancy est derivee de cet objet,
 * jamais d'un parametre fourni par le client.
 */
public record AuthPrincipal(Long id, String email, String role, Long agenceId,
                            boolean doitChangerMotDePasse) {

    public AuthPrincipal(Long id, String email, String role, Long agenceId) {
        this(id, email, role, agenceId, false);
    }

    public boolean isGlobal() {
        return "ADMIN".equals(role) || "DIRECTEUR".equals(role);
    }

    public boolean isAdmin() {
        return "ADMIN".equals(role);
    }
}
