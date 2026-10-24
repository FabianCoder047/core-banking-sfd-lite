package com.sfd.utilisateur;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record UtilisateurRequest(
        @NotBlank @Email @Size(max = 150) String email,
        @NotBlank @Size(max = 80) String nom,
        @NotBlank @Size(max = 80) String prenom,
        @NotNull Role role,
        Long agenceId,
        Boolean actif) {
}
