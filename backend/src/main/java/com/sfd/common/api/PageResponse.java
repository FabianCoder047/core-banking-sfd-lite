package com.sfd.common.api;

import org.springframework.data.domain.Page;

import java.util.List;
import java.util.function.Function;

/**
 * Reponse paginee standard de l'API : {contenu, page, taille, total}.
 */
public record PageResponse<T>(List<T> contenu, int page, int taille, long total) {

    public static <E, D> PageResponse<D> from(Page<E> page, Function<E, D> mapper) {
        return new PageResponse<>(
                page.getContent().stream().map(mapper).toList(),
                page.getNumber(),
                page.getSize(),
                page.getTotalElements());
    }
}
