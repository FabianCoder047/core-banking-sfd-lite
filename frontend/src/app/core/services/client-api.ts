import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Client, ClientFiche, ClientRequest, CompteEpargne, PageResponse } from '../models';

@Injectable({ providedIn: 'root' })
export class ClientApi {
  private readonly http = inject(HttpClient);

  rechercher(q = '', page = 0, taille = 20, agenceId?: number) {
    let params = new HttpParams().set('q', q).set('page', page).set('size', taille);
    if (agenceId) {
      params = params.set('agenceId', agenceId);
    }
    return this.http.get<PageResponse<Client>>('/api/clients', { params });
  }

  fiche(id: number) {
    return this.http.get<ClientFiche>(`/api/clients/${id}`);
  }

  creer(payload: ClientRequest) {
    return this.http.post<Client>('/api/clients', payload);
  }

  ouvrirCompte(clientId: number) {
    return this.http.post<CompteEpargne>(`/api/clients/${clientId}/comptes`, {});
  }
}
