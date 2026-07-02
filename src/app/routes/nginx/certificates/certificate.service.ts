import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { PageResult } from '@shared/types/page';
import { Observable } from 'rxjs';

export type CertificateId = number | string;

export interface CertificateRecord {
  guid?: string;
  name: string;
  serverName?: string;
  certPath: string;
  keyPath: string;
  issuer?: string;
  notBefore?: number;
  notAfter?: number;
  autoRenew?: boolean;
  description?: string;
}

export interface CertificateListQuery {
  page: number;
  size: number;
  content: string;
  [key: string]: string | number | boolean | undefined;
}

@Injectable({ providedIn: 'root' })
export class CertificateService {
  private readonly http = inject(HttpClient);

  list(query: CertificateListQuery): Observable<PageResult<CertificateRecord>> {
    return this.http.get<PageResult<CertificateRecord>>('/certificates/list', { params: this.params(query) });
  }

  detail(id: CertificateId): Observable<CertificateRecord> {
    return this.http.get<CertificateRecord>(`/certificates/${id}`);
  }

  create(cert: CertificateRecord): Observable<boolean> {
    return this.http.post<boolean>('/certificates', cert);
  }

  update(cert: CertificateRecord): Observable<boolean> {
    return this.http.put<boolean>(`/certificates/${cert.guid}`, cert);
  }

  delete(id: CertificateId): Observable<boolean> {
    return this.http.delete<boolean>(`/certificates/${id}`);
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
