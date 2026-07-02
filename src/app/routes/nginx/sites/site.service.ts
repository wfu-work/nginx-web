import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { PageResult } from '@shared/types/page';
import { Observable } from 'rxjs';

export type SiteId = number | string;

export interface SiteRecord {
  guid?: string;
  name: string;
  serverName: string;
  listen?: string;
  enabled?: boolean;
  root?: string;
  index?: string;
  accessLog?: string;
  errorLog?: string;
  certificateGuid?: string;
  ssl?: boolean;
  extraConfig?: string;
}

export interface LocationRule {
  guid?: string;
  siteGuid?: string;
  path: string;
  proxyPass?: string;
  root?: string;
  extraConfig?: string;
  sort?: number;
}

export interface SiteDetail {
  site: SiteRecord;
  locations: LocationRule[];
}

export interface CertificateOption {
  guid?: string;
  name: string;
  serverName?: string;
  certPath?: string;
}

export interface SiteListQuery {
  page: number;
  size: number;
  content: string;
  [key: string]: string | number | boolean | undefined;
}

@Injectable({ providedIn: 'root' })
export class SiteService {
  private readonly http = inject(HttpClient);

  list(query: SiteListQuery): Observable<PageResult<SiteRecord>> {
    return this.http.get<PageResult<SiteRecord>>('/sites/list', { params: this.params(query) });
  }

  detail(id: SiteId): Observable<SiteDetail> {
    return this.http.get<SiteDetail>(`/sites/${id}`);
  }

  create(site: SiteRecord): Observable<boolean> {
    return this.http.post<boolean>('/sites', site);
  }

  update(site: SiteRecord): Observable<boolean> {
    return this.http.put<boolean>(`/sites/${site.guid}`, site);
  }

  toggle(id: SiteId, enabled: boolean): Observable<boolean> {
    return this.http.post<boolean>(`/sites/${id}/${enabled ? 'enable' : 'disable'}`, {});
  }

  delete(id: SiteId): Observable<boolean> {
    return this.http.delete<boolean>(`/sites/${id}`);
  }

  createLocation(siteGuid: string, location: LocationRule): Observable<boolean> {
    return this.http.post<boolean>(`/sites/${siteGuid}/locations`, location);
  }

  updateLocation(siteGuid: string, location: LocationRule): Observable<boolean> {
    return this.http.put<boolean>(`/sites/${siteGuid}/locations/${location.guid}`, location);
  }

  deleteLocation(siteGuid: string, locationGuid: string): Observable<boolean> {
    return this.http.delete<boolean>(`/sites/${siteGuid}/locations/${locationGuid}`);
  }

  certificates(): Observable<PageResult<CertificateOption>> {
    return this.http.get<PageResult<CertificateOption>>('/certificates/list', {
      params: this.params({ page: 1, size: 100, content: '' }),
    });
  }

  private params(query: Record<string, string | number | boolean | undefined>): HttpParams {
    let params = new HttpParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') return;
      params = params.set(key, String(value));
    });
    return params;
  }
}
