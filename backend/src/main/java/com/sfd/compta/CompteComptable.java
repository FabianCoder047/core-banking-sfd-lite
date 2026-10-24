package com.sfd.compta;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "compte_comptable")
@Getter
@Setter
@NoArgsConstructor
public class CompteComptable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 10)
    private String numero;

    @Column(nullable = false, length = 120)
    private String libelle;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private TypeCompte type;
}
