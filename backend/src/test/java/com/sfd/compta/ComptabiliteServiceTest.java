package com.sfd.compta;

import com.sfd.agence.Agence;
import com.sfd.common.error.BusinessException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class ComptabiliteServiceTest {

    private EcritureRepository ecritureRepository;
    private CompteComptableRepository compteRepository;
    private ComptabiliteService service;

    @BeforeEach
    void setUp() {
        ecritureRepository = mock(EcritureRepository.class);
        compteRepository = mock(CompteComptableRepository.class);
        service = new ComptabiliteService(ecritureRepository, compteRepository);
        when(compteRepository.findByNumero("101")).thenReturn(Optional.of(compte("101", "Caisse")));
        when(compteRepository.findByNumero("201")).thenReturn(Optional.of(compte("201", "Depots")));
        when(ecritureRepository.save(any(Ecriture.class))).thenAnswer(inv -> inv.getArgument(0));
    }

    @Test
    void rejette_une_ecriture_desequilibree_sans_la_persister() {
        List<LigneEcritureCommand> lignes = List.of(
                LigneEcritureCommand.debit("101", new BigDecimal("1000")),
                LigneEcritureCommand.credit("201", new BigDecimal("900")));

        assertThatThrownBy(() -> service.enregistrer(new Agence(), null, Journal.CAISSE,
                "Depot", LocalDate.now(), lignes))
                .isInstanceOf(BusinessException.class)
                .extracting("code").isEqualTo("ECRITURE_DESEQUILIBREE");

        verify(ecritureRepository, never()).save(any());
    }

    @Test
    void accepte_une_ecriture_equilibree() {
        Ecriture ecriture = service.enregistrer(new Agence(), null, Journal.CAISSE, "Depot",
                LocalDate.of(2026, 5, 10), List.of(
                        LigneEcritureCommand.debit("101", new BigDecimal("1000")),
                        LigneEcritureCommand.credit("201", new BigDecimal("1000"))));

        assertThat(ecriture.getLignes()).hasSize(2);
        assertThat(ecriture.getDateComptable()).isEqualTo(LocalDate.of(2026, 5, 10));
        assertThat(ecriture.getJournal()).isEqualTo(Journal.CAISSE);
        verify(ecritureRepository).save(ecriture);
    }

    @Test
    void refuse_d_extourner_deux_fois_la_meme_ecriture() {
        Ecriture originale = new Ecriture();
        originale.setId(7L);
        when(ecritureRepository.findWithLignesById(7L)).thenReturn(Optional.of(originale));
        when(ecritureRepository.existsByExtourneDeId(7L)).thenReturn(true);

        assertThatThrownBy(() -> service.extourner(7L))
                .isInstanceOf(BusinessException.class)
                .extracting("code").isEqualTo("ECRITURE_DEJA_EXTOURNEE");
    }

    private CompteComptable compte(String numero, String libelle) {
        CompteComptable compte = new CompteComptable();
        compte.setNumero(numero);
        compte.setLibelle(libelle);
        compte.setType(TypeCompte.ACTIF);
        return compte;
    }
}
