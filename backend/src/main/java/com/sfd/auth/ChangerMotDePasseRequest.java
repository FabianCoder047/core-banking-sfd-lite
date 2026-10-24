package com.sfd.auth;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ChangerMotDePasseRequest(
        @NotBlank String motDePasseActuel,
        @NotBlank @Size(min = 8, max = 100) String nouveauMotDePasse) {
}
