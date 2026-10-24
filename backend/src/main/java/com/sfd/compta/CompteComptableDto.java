package com.sfd.compta;

public record CompteComptableDto(Long id, String numero, String libelle, TypeCompte type) {

    public static CompteComptableDto from(CompteComptable compte) {
        return new CompteComptableDto(compte.getId(), compte.getNumero(), compte.getLibelle(), compte.getType());
    }
}
