package com.sfd.operation;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface OperationRepository extends JpaRepository<Operation, Long> {

    @Query(value = "select nextval('operation_ref_seq')", nativeQuery = true)
    long prochainNumeroSequence();

    Optional<Operation> findByReference(String reference);

    @Query("""
            select o from Operation o
            where o.compte.id = :compteId
              and o.dateOperation >= :du
              and o.dateOperation < :au
            order by o.dateOperation desc, o.id desc
            """)
    Page<Operation> releveCompte(@Param("compteId") Long compteId,
                                 @Param("du") Instant du,
                                 @Param("au") Instant au,
                                 Pageable pageable);

    @Query("""
            select function('to_char', o.dateOperation, 'YYYY-MM'), coalesce(sum(o.montant), 0)
            from Operation o
            where o.type = :type
              and o.dateOperation >= :du
              and (:agenceId is null or o.agence.id = :agenceId)
            group by function('to_char', o.dateOperation, 'YYYY-MM')
            order by function('to_char', o.dateOperation, 'YYYY-MM')
            """)
    List<Object[]> sommeParMois(@Param("type") TypeOperation type,
                                @Param("du") Instant du,
                                @Param("agenceId") Long agenceId);
}
