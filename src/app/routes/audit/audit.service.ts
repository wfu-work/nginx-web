import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { PageResult } from '@shared/types/page';
import { Observable } from 'rxjs';

export interface AuditRecord {
  guid?: string;
  action?: string;
  resourceType?: string;
  resourceGuid?: string;
  success?: boolean;
  status?: string;
  message?: string;
  reason?: string;
  detail?: string;
  createTime?: number;
}

export interface AuditListQuery {
  page: number;
  size: number;
  content: string;
  action: string;
  status: string;
  desc: string;
  [key: string]: string | number | boolean | undefined;
}

@Injectable({ providedIn: 'root' })
export class AuditService {
  private readonly http = inject(HttpClient);

  list(query: AuditListQuery): Observable<PageResult<AuditRecord>> {
    return this.http.get<PageResult<AuditRecord>>('/logs/audit/list', { params: this.params(query) });
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
