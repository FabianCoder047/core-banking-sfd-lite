package com.sfd.client;

import com.sfd.credit.CreditDto;
import com.sfd.epargne.CompteEpargneDto;

import java.util.List;

public record ClientFicheDto(
        ClientDto client,
        List<CompteEpargneDto> comptes,
        List<CreditDto> credits) {
}
