package com.sfd.credit;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Entity
@Table(name = "produit_credit")
@Getter
@Setter
@NoArgsConstructor
public class ProduitCredit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 20)
    private String code;

    @Column(nullable = false, length = 100)
    private String libelle;

    @Column(name = "taux_annuel", nullable = false, precision = 6, scale = 3)
    private BigDecimal tauxAnnuel;

    @Column(name = "duree_min_mois", nullable = false)
    private int dureeMinMois;

    @Column(name = "duree_max_mois", nullable = false)
    private int dureeMaxMois;

    @Column(name = "montant_min", nullable = false, precision = 18, scale = 0)
    private BigDecimal montantMin;

    @Column(name = "montant_max", nullable = false, precision = 18, scale = 0)
    private BigDecimal montantMax;

    @Column(name = "frais_dossier_pct", nullable = false, precision = 5, scale = 2)
    private BigDecimal fraisDossierPct = BigDecimal.ZERO;

    @Enumerated(EnumType.STRING)
    @Column(name = "mode_amortissement", nullable = false, length = 20)
    private ModeAmortissement modeAmortissement;

    @Column(nullable = false)
    private boolean actif = true;
}
