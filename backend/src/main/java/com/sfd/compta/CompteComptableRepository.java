package com.sfd.compta;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CompteComptableRepository extends JpaRepository<CompteComptable, Long> {

    Optional<CompteComptable> findByNumero(String numero);

    boolean existsByNumero(String numero);

    List<CompteComptable> findAllByOrderByNumeroAsc();
}
