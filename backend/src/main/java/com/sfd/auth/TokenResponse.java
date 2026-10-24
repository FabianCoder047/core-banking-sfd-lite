package com.sfd.auth;

import com.sfd.utilisateur.UtilisateurDto;

public record TokenResponse(
        String accessToken,
        String refreshToken,
        long expiresIn,
        UtilisateurDto utilisateur) {
}
