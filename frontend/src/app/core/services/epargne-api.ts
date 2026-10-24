import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { CompteEpargne, Operation, PageResponse } from '../models';

@Injectable({ providedIn: 'root' })
export class EpargneApi {
  private readonly http = inject(HttpClient);

  obtenir(compteId: number) {
    return this.http.get<CompteEpargne>(`/api/comptes/${compteId}`);
  }

  depot(compteId: number, montant: number) {
    return this.http.post<Operation>(`/api/comptes/${compteId}/depots`, { montant });
  }

  retrait(compteId: number, montant: number) {
    return this.http.post<Operation>(`/api/comptes/${compteId}/retraits`, { montant });
  }

  releve(compteId: number, page = 0, taille = 20, du?: string, au?: string) {
    let params = new HttpParams().set('page', page).set('taille', taille);
    if (du) {
      params = params.set('du', du);
    }
    if (au) {
      params = params.set('au', au);
    }
    return this.http.get<PageResponse<Operation>>(`/api/comptes/${compteId}/releve`, { params });
  }
}
