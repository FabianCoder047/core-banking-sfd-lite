package com.sfd.credit;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public interface EcheanceRepository extends JpaRepository<Echeance, Long> {

    List<Echeance> findByCreditIdOrderByNumeroAsc(Long creditId);

    @Query("""
            select coalesce(sum(e.capitalDu - e.capitalPaye), 0) from Echeance e
            where e.credit.statut = com.sfd.credit.StatutCredit.DECAISSE
              and (:agenceId is null or e.credit.agence.id = :agenceId)
            """)
    BigDecimal encoursCapital(@Param("agenceId") Long agenceId);

    @Query("""
            select count(e) from Echeance e
            where e.credit.statut = com.sfd.credit.StatutCredit.DECAISSE
              and e.dateEcheance < :aujourdHui
              and (e.capitalDu > e.capitalPaye or e.interetDu > e.interetPaye)
              and (:agenceId is null or e.credit.agence.id = :agenceId)
            """)
    long compterEnRetard(@Param("aujourdHui") LocalDate aujourdHui,
                         @Param("agenceId") Long agenceId);

    @Query("""
            select coalesce(sum((e.capitalDu - e.capitalPaye) + (e.interetDu - e.interetPaye)), 0)
            from Echeance e
            where e.credit.statut = com.sfd.credit.StatutCredit.DECAISSE
              and e.dateEcheance < :aujourdHui
              and (e.capitalDu > e.capitalPaye or e.interetDu > e.interetPaye)
              and (:agenceId is null or e.credit.agence.id = :agenceId)
            """)
    BigDecimal montantImpaye(@Param("aujourdHui") LocalDate aujourdHui,
                             @Param("agenceId") Long agenceId);
}
