package com.sfd.credit;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "echeance")
@Getter
@Setter
@NoArgsConstructor
public class Echeance {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "credit_id", nullable = false)
    private Credit credit;

    @Column(nullable = false)
    private int numero;

    @Column(name = "date_echeance", nullable = false)
    private LocalDate dateEcheance;

    @Column(name = "capital_du", nullable = false, precision = 18, scale = 0)
    private BigDecimal capitalDu;

    @Column(name = "interet_du", nullable = false, precision = 18, scale = 0)
    private BigDecimal interetDu;

    @Column(name = "capital_paye", nullable = false, precision = 18, scale = 0)
    private BigDecimal capitalPaye = BigDecimal.ZERO;

    @Column(name = "interet_paye", nullable = false, precision = 18, scale = 0)
    private BigDecimal interetPaye = BigDecimal.ZERO;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private StatutEcheance statut = StatutEcheance.A_PAYER;

    public BigDecimal capitalRestant() {
        return capitalDu.subtract(capitalPaye);
    }

    public BigDecimal interetRestant() {
        return interetDu.subtract(interetPaye);
    }

    public BigDecimal totalRestant() {
        return capitalRestant().add(interetRestant());
    }

    public boolean estSoldee() {
        return capitalRestant().signum() == 0 && interetRestant().signum() == 0;
    }
}
