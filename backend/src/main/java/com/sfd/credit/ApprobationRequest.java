package com.sfd.credit;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record ApprobationRequest(
        @NotNull DecisionCredit decision,
        @Size(max = 255) String motif) {
}
