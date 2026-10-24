package com.sfd.client;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface ClientRepository extends JpaRepository<Client, Long> {

    @Query(value = "select nextval('client_numero_seq')", nativeQuery = true)
    long prochainNumeroSequence();

    @Query("""
            select c from Client c
            where (:agenceId is null or c.agence.id = :agenceId)
              and (:q = '' or lower(c.numero) like lower(concat('%', :q, '%'))
                   or lower(c.nom) like lower(concat('%', :q, '%'))
                   or lower(c.prenom) like lower(concat('%', :q, '%'))
                   or c.telephone like concat('%', :q, '%'))
            """)
    Page<Client> rechercher(@Param("agenceId") Long agenceId,
                            @Param("q") String q,
                            Pageable pageable);

    Optional<Client> findByIdAndAgenceId(Long id, Long agenceId);

    @Query("select count(c) from Client c where (:agenceId is null or c.agence.id = :agenceId)")
    long compter(@Param("agenceId") Long agenceId);
}
