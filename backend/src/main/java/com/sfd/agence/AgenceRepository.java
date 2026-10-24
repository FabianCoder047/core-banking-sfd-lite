package com.sfd.agence;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface AgenceRepository extends JpaRepository<Agence, Long> {

    Optional<Agence> findByCode(String code);

    boolean existsByCodeIgnoreCase(String code);

    List<Agence> findAllByOrderByCodeAsc();

    @Query("""
            select a.id, a.code, a.nom,
                   (select count(c.id) from Client c where c.agence.id = a.id),
                   (select coalesce(sum(ce.solde), 0) from CompteEpargne ce
                    where ce.agence.id = a.id and ce.statut = com.sfd.epargne.StatutCompte.ACTIF),
                   (select coalesce(sum(e.capitalDu - e.capitalPaye), 0) from Echeance e
                    where e.credit.agence.id = a.id and e.credit.statut = com.sfd.credit.StatutCredit.DECAISSE),
                   (select count(cr.id) from Credit cr
                    where cr.agence.id = a.id and cr.statut = com.sfd.credit.StatutCredit.DEMANDE)
            from Agence a
            where a.active = true
              and (:agenceId is null or a.id = :agenceId)
            order by a.code
            """)
    List<Object[]> statistiquesParAgence(@Param("agenceId") Long agenceId);
}
