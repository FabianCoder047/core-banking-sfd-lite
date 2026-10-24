package com.sfd.credit;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ProduitCreditRepository extends JpaRepository<ProduitCredit, Long> {

    Optional<ProduitCredit> findByCode(String code);

    boolean existsByCodeIgnoreCase(String code);

    List<ProduitCredit> findAllByOrderByCodeAsc();
}
