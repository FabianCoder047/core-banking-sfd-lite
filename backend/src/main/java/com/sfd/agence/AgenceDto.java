package com.sfd.agence;

public record AgenceDto(Long id, String code, String nom, String ville, boolean active) {

    public static AgenceDto from(Agence agence) {
        return new AgenceDto(agence.getId(), agence.getCode(), agence.getNom(),
                agence.getVille(), agence.isActive());
    }
}
