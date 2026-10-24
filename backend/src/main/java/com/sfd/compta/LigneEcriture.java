package com.sfd.compta;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;

@Entity
@Table(name = "ligne_ecriture")
@Getter
@Setter
@NoArgsConstructor
public class LigneEcriture {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "ecriture_id", nullable = false)
    private Ecriture ecriture;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "compte_comptable_id", nullable = false)
    private CompteComptable compteComptable;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(nullable = false, length = 1)
    private Sens sens;

    @Column(nullable = false, precision = 18, scale = 0)
    private BigDecimal montant;
}
