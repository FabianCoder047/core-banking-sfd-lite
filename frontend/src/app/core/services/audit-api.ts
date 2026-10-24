import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { AuditEvenement, PageResponse } from '../models';

@Injectable({ providedIn: 'root' })
export class AuditApi {
  private readonly http = inject(HttpClient);

  lister(page = 0, taille = 25) {
    const params = new HttpParams().set('page', page).set('size', taille);
    return this.http.get<PageResponse<AuditEvenement>>('/api/audits', { params });
  }
}
