import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Dashboard } from '../models';

@Injectable({ providedIn: 'root' })
export class DashboardApi {
  private readonly http = inject(HttpClient);

  charger(agenceId?: number | null) {
    let params = new HttpParams();
    if (agenceId) {
      params = params.set('agenceId', agenceId);
    }
    return this.http.get<Dashboard>('/api/dashboard', { params });
  }
}
