package com.sfd.common.api;

import java.math.BigDecimal;
import java.math.RoundingMode;

/**
 * Le FCFA n'a pas de decimales : tous les montants sont arrondis a l'unite (HALF_UP).
 */
public final class Montants {

    public static final RoundingMode ARRONDI = RoundingMode.HALF_UP;
    public static final BigDecimal ZERO = BigDecimal.ZERO.setScale(0, RoundingMode.UNNECESSARY);

    private Montants() {
    }

    public static BigDecimal arrondir(BigDecimal valeur) {
        return valeur.setScale(0, ARRONDI);
    }

    public static BigDecimal zeroSiNull(BigDecimal valeur) {
        return valeur == null ? BigDecimal.ZERO : valeur;
    }

    public static boolean estPositif(BigDecimal valeur) {
        return valeur != null && valeur.signum() > 0;
    }
}
