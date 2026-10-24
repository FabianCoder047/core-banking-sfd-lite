package com.sfd.compta;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CompteComptableRequest(
        @NotBlank @Size(max = 10) String numero,
        @NotBlank @Size(max = 120) String libelle,
        @NotNull TypeCompte type) {
}
