package com.sfd.compta;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface EcritureRepository extends JpaRepository<Ecriture, Long> {

    @EntityGraph(attributePaths = {"lignes", "lignes.compteComptable"})
    Optional<Ecriture> findWithLignesById(Long id);

    boolean existsByExtourneDeId(Long extourneDeId);

    @Query("""
            select new com.sfd.compta.BalanceLigneBrute(
                l.compteComptable.numero, l.compteComptable.libelle, l.compteComptable.type,
                sum(case when l.sens = com.sfd.compta.Sens.D then l.montant else 0 end),
                sum(case when l.sens = com.sfd.compta.Sens.C then l.montant else 0 end))
            from LigneEcriture l
            where l.ecriture.dateComptable between :du and :au
              and (:agenceId is null or l.ecriture.agence.id = :agenceId)
            group by l.compteComptable.numero, l.compteComptable.libelle, l.compteComptable.type
            order by l.compteComptable.numero
            """)
    List<BalanceLigneBrute> balance(@Param("du") LocalDate du,
                                    @Param("au") LocalDate au,
                                    @Param("agenceId") Long agenceId);

    @Query("""
            select new com.sfd.compta.GrandLivreLigneBrute(
                l.ecriture.id, l.ecriture.dateComptable, l.ecriture.journal,
                l.ecriture.libelle, l.sens, l.montant)
            from LigneEcriture l
            where l.compteComptable.numero = :numero
              and l.ecriture.dateComptable between :du and :au
              and (:agenceId is null or l.ecriture.agence.id = :agenceId)
            order by l.ecriture.dateComptable asc, l.ecriture.id asc, l.id asc
            """)
    List<GrandLivreLigneBrute> grandLivre(@Param("numero") String numero,
                                          @Param("du") LocalDate du,
                                          @Param("au") LocalDate au,
                                          @Param("agenceId") Long agenceId);
}
