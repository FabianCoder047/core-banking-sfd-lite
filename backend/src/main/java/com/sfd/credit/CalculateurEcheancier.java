package com.sfd.credit;

import com.sfd.common.api.Montants;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.MathContext;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/**
 * Echeancier mensuel a taux fixe. Regles :
 * - i = tauxAnnuel / 100 / 12 ;
 * - ANNUITE_CONSTANTE : a = P*i/(1-(1+i)^-n), interet = solde * i, capital = a - interet ;
 * - CAPITAL_CONSTANT : capital = P/n, interet = solde * i ;
 * - arrondi HALF_UP a l'unite, la derniere echeance absorbe l'ecart.
 */
@Component
public class CalculateurEcheancier {

    private static final MathContext MC = MathContext.DECIMAL128;

    public List<EcheanceCalculee> calculer(BigDecimal capital, int dureeMois,
                                           BigDecimal tauxAnnuel, ModeAmortissement mode,
                                           LocalDate dateDecaissement) {
        if (dureeMois <= 0) {
            throw new IllegalArgumentException("La duree doit etre strictement positive");
        }
        BigDecimal tauxPeriodique = tauxAnnuel
                .divide(BigDecimal.valueOf(1200), 12, Montants.ARRONDI);
        List<EcheanceCalculee> echeances = new ArrayList<>(dureeMois);

        if (mode == ModeAmortissement.ANNUITE_CONSTANTE) {
            BigDecimal annuite = annuite(capital, tauxPeriodique, dureeMois);
            BigDecimal solde = capital;
            BigDecimal capitalCumule = BigDecimal.ZERO;
            for (int k = 1; k <= dureeMois; k++) {
                BigDecimal interet = Montants.arrondir(solde.multiply(tauxPeriodique));
                BigDecimal capitalEcheance;
                if (k == dureeMois) {
                    capitalEcheance = capital.subtract(capitalCumule);
                } else {
                    capitalEcheance = Montants.arrondir(annuite).subtract(interet);
                    if (capitalEcheance.signum() < 0) {
                        capitalEcheance = BigDecimal.ZERO;
                    }
                }
                echeances.add(new EcheanceCalculee(k, dateDecaissement.plusMonths(k),
                        capitalEcheance, interet));
                capitalCumule = capitalCumule.add(capitalEcheance);
                solde = solde.subtract(capitalEcheance);
            }
        } else {
            BigDecimal capitalBase = capital.divide(BigDecimal.valueOf(dureeMois), 0, Montants.ARRONDI);
            BigDecimal solde = capital;
            BigDecimal capitalCumule = BigDecimal.ZERO;
            for (int k = 1; k <= dureeMois; k++) {
                BigDecimal interet = Montants.arrondir(solde.multiply(tauxPeriodique));
                BigDecimal capitalEcheance = (k == dureeMois)
                        ? capital.subtract(capitalCumule)
                        : capitalBase;
                echeances.add(new EcheanceCalculee(k, dateDecaissement.plusMonths(k),
                        capitalEcheance, interet));
                capitalCumule = capitalCumule.add(capitalEcheance);
                solde = solde.subtract(capitalEcheance);
            }
        }
        return echeances;
    }

    private BigDecimal annuite(BigDecimal capital, BigDecimal tauxPeriodique, int dureeMois) {
        if (tauxPeriodique.signum() == 0) {
            return capital.divide(BigDecimal.valueOf(dureeMois), 0, Montants.ARRONDI);
        }
        BigDecimal facteur = BigDecimal.ONE.add(tauxPeriodique).pow(dureeMois, MC);
        return capital.multiply(tauxPeriodique, MC).multiply(facteur, MC)
                .divide(facteur.subtract(BigDecimal.ONE), MC);
    }
}
