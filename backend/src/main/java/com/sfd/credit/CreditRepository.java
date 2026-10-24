package com.sfd.credit;

import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface CreditRepository extends JpaRepository<Credit, Long> {

    @Query(value = "select nextval('credit_numero_seq')", nativeQuery = true)
    long prochainNumeroSequence();

    long countByClientIdAndStatut(Long clientId, StatutCredit statut);

    @Query("""
            select count(c) from Credit c
            where c.statut = :statut
              and (:agenceId is null or c.agence.id = :agenceId)
            """)
    long compterParStatut(@Param("statut") StatutCredit statut, @Param("agenceId") Long agenceId);

    List<Credit> findByClientIdOrderByDateDemandeDescIdDesc(Long clientId);

    boolean existsByProduitId(Long produitId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select c from Credit c where c.id = :id")
    Optional<Credit> findByIdForUpdate(@Param("id") Long id);

    @Query("""
            select c from Credit c
            where (:agenceId is null or c.agence.id = :agenceId)
              and (:statut is null or c.statut = :statut)
              and (:clientId is null or c.client.id = :clientId)
            order by c.dateDemande desc, c.id desc
            """)
    Page<Credit> rechercher(@Param("agenceId") Long agenceId,
                            @Param("statut") StatutCredit statut,
                            @Param("clientId") Long clientId,
                            Pageable pageable);
}
