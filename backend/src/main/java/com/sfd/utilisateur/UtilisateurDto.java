package com.sfd.utilisateur;

import java.time.Instant;

public record UtilisateurDto(
        Long id,
        String email,
        String nom,
        String prenom,
        Role role,
        Long agenceId,
        String agenceNom,
        boolean actif,
        boolean doitChangerMotDePasse,
        Instant creeLe) {

    public static UtilisateurDto from(Utilisateur utilisateur) {
        return new UtilisateurDto(
                utilisateur.getId(),
                utilisateur.getEmail(),
                utilisateur.getNom(),
                utilisateur.getPrenom(),
                utilisateur.getRole(),
                utilisateur.getAgence() == null ? null : utilisateur.getAgence().getId(),
                utilisateur.getAgence() == null ? null : utilisateur.getAgence().getNom(),
                utilisateur.isActif(),
                utilisateur.isDoitChangerMotDePasse(),
                utilisateur.getCreeLe());
    }
}
