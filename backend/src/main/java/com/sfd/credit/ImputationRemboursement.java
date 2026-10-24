package com.sfd.credit;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

/**
 * Imputation d'un remboursement : echeances les plus anciennes d'abord,
 * interets avant capital sur chaque echeance (RG-09).
 */
public final class ImputationRemboursement {

    public record Ligne(int numeroEcheance, BigDecimal capital, BigDecimal interet) {
    }

    private ImputationRemboursement() {
    }

    public static List<Ligne> repartir(List<Echeance> echeances, BigDecimal montant) {
        BigDecimal reste = montant;
        List<Ligne> lignes = new ArrayList<>();
        for (Echeance echeance : echeances) {
            if (reste.signum() == 0) {
                break;
            }
            BigDecimal interetRestant = echeance.interetRestant();
            BigDecimal capitalRestant = echeance.capitalRestant();
            if (interetRestant.signum() == 0 && capitalRestant.signum() == 0) {
                continue;
            }
            BigDecimal interet = reste.min(interetRestant);
            reste = reste.subtract(interet);
            BigDecimal capital = reste.min(capitalRestant);
            reste = reste.subtract(capital);
            if (interet.signum() > 0 || capital.signum() > 0) {
                lignes.add(new Ligne(echeance.getNumero(), capital, interet));
            }
        }
        return lignes;
    }
}
