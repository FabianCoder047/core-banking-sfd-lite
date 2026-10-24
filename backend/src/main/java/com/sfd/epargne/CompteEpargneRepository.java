package com.sfd.epargne;

import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

public interface CompteEpargneRepository extends JpaRepository<CompteEpargne, Long> {

    @Query(value = "select nextval('compte_numero_seq')", nativeQuery = true)
    long prochainNumeroSequence();

    List<CompteEpargne> findByClientIdOrderByOuvertLeDesc(Long clientId);

    Optional<CompteEpargne> findByIdAndAgenceId(Long id, Long agenceId);

    /** Verrou pessimiste obligatoire pour toute mise a jour de solde (RG-02). */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select c from CompteEpargne c where c.id = :id")
    Optional<CompteEpargne> findByIdForUpdate(@Param("id") Long id);

    @Query("""
            select coalesce(sum(c.solde), 0) from CompteEpargne c
            where c.statut = com.sfd.epargne.StatutCompte.ACTIF
              and (:agenceId is null or c.agence.id = :agenceId)
            """)
    BigDecimal sommeSoldes(@Param("agenceId") Long agenceId);

    long countByAgenceIdAndStatut(Long agenceId, StatutCompte statut);

    @Query("""
            select count(c) from CompteEpargne c
            where c.statut = com.sfd.epargne.StatutCompte.ACTIF
              and (:agenceId is null or c.agence.id = :agenceId)
            """)
    long compterActifs(@Param("agenceId") Long agenceId);
}
