import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Agence, AgenceRequest, PageResponse, Utilisateur, UtilisateurRequest } from '../models';

@Injectable({ providedIn: 'root' })
export class AdminApi {
  private readonly http = inject(HttpClient);

  agences() {
    return this.http.get<Agence[]>('/api/agences');
  }

  creerAgence(payload: AgenceRequest) {
    return this.http.post<Agence>('/api/agences', payload);
  }

  modifierAgence(id: number, payload: AgenceRequest) {
    return this.http.put<Agence>(`/api/agences/${id}`, payload);
  }

  supprimerAgence(id: number) {
    return this.http.delete<void>(`/api/agences/${id}`);
  }

  utilisateurs(page = 0, taille = 50, agenceId?: number | null) {
    let params = new HttpParams().set('page', page).set('size', taille);
    if (agenceId) {
      params = params.set('agenceId', agenceId);
    }
    return this.http.get<PageResponse<Utilisateur>>('/api/utilisateurs', { params });
  }

  creerUtilisateur(payload: UtilisateurRequest) {
    return this.http.post<Utilisateur>('/api/utilisateurs', payload);
  }

  modifierUtilisateur(id: number, payload: UtilisateurRequest) {
    return this.http.put<Utilisateur>(`/api/utilisateurs/${id}`, payload);
  }

  supprimerUtilisateur(id: number) {
    return this.http.delete<void>(`/api/utilisateurs/${id}`);
  }
}
