import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Balance, CompteComptable, CompteComptableRequest, Ecriture, GrandLivre } from '../models';

@Injectable({ providedIn: 'root' })
export class ComptaApi {
  private readonly http = inject(HttpClient);

  balance(du?: string, au?: string, agenceId?: number | null) {
    let params = new HttpParams();
    if (du) {
      params = params.set('du', du);
    }
    if (au) {
      params = params.set('au', au);
    }
    if (agenceId) {
      params = params.set('agenceId', agenceId);
    }
    return this.http.get<Balance>('/api/comptabilite/balance', { params });
  }

  grandLivre(compte: string, du?: string, au?: string, agenceId?: number | null) {
    let params = new HttpParams().set('compte', compte);
    if (du) {
      params = params.set('du', du);
    }
    if (au) {
      params = params.set('au', au);
    }
    if (agenceId) {
      params = params.set('agenceId', agenceId);
    }
    return this.http.get<GrandLivre>('/api/comptabilite/grand-livre', { params });
  }

  comptes() {
    return this.http.get<CompteComptable[]>('/api/comptabilite/comptes');
  }

  ecriture(id: number) {
    return this.http.get<Ecriture>(`/api/comptabilite/ecritures/${id}`);
  }

  extourner(ecritureId: number) {
    return this.http.post<Ecriture>(`/api/comptabilite/ecritures/${ecritureId}/extourne`, {});
  }

  creerCompte(payload: CompteComptableRequest) {
    return this.http.post<CompteComptable>('/api/comptabilite/comptes', payload);
  }

  modifierCompte(id: number, payload: CompteComptableRequest) {
    return this.http.put<CompteComptable>(`/api/comptabilite/comptes/${id}`, payload);
  }

  supprimerCompte(id: number) {
    return this.http.delete<void>(`/api/comptabilite/comptes/${id}`);
  }
}
