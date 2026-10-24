import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import {
  Credit,
  Echeancier,
  PageResponse,
  ProduitCredit,
  ProduitCreditRequest,
  Remboursement,
  StatutCredit,
} from '../models';

@Injectable({ providedIn: 'root' })
export class CreditApi {
  private readonly http = inject(HttpClient);

  lister(options: {
    statut?: StatutCredit | null;
    clientId?: number | null;
    agenceId?: number | null;
    page?: number;
    taille?: number;
  } = {}) {
    let params = new HttpParams()
      .set('page', options.page ?? 0)
      .set('size', options.taille ?? 20);
    if (options.statut) {
      params = params.set('statut', options.statut);
    }
    if (options.clientId) {
      params = params.set('clientId', options.clientId);
    }
    if (options.agenceId) {
      params = params.set('agenceId', options.agenceId);
    }
    return this.http.get<PageResponse<Credit>>('/api/credits', { params });
  }

  obtenir(id: number) {
    return this.http.get<Credit>(`/api/credits/${id}`);
  }

  demander(payload: { clientId: number; produitId: number; compteId: number; montant: number; dureeMois: number }) {
    return this.http.post<Credit>('/api/credits', payload);
  }

  approuver(id: number, decision: 'APPROUVE' | 'REJETE', motif?: string) {
    return this.http.post<Credit>(`/api/credits/${id}/approbation`, { decision, motif });
  }

  decaisser(id: number) {
    return this.http.post<Credit>(`/api/credits/${id}/decaissement`, {});
  }

  echeancier(id: number) {
    return this.http.get<Echeancier>(`/api/credits/${id}/echeancier`);
  }

  rembourser(id: number, montant: number) {
    return this.http.post<Remboursement>(`/api/credits/${id}/remboursements`, { montant });
  }
}

@Injectable({ providedIn: 'root' })
export class ProduitApi {
  private readonly http = inject(HttpClient);

  lister() {
    return this.http.get<ProduitCredit[]>('/api/produits-credit');
  }

  creer(payload: ProduitCreditRequest) {
    return this.http.post<ProduitCredit>('/api/produits-credit', payload);
  }

  modifier(id: number, payload: ProduitCreditRequest) {
    return this.http.put<ProduitCredit>(`/api/produits-credit/${id}`, payload);
  }

  supprimer(id: number) {
    return this.http.delete<void>(`/api/produits-credit/${id}`);
  }
}
