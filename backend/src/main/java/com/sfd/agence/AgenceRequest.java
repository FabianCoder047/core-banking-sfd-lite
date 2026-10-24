package com.sfd.agence;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AgenceRequest(
        @NotBlank @Size(max = 10) String code,
        @NotBlank @Size(max = 100) String nom,
        @Size(max = 100) String ville,
        Boolean active) {
}
