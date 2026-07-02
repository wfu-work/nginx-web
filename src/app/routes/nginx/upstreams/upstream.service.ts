import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { PageResult } from '@shared/types/page';
import { Observable } from 'rxjs';

export type UpstreamId = number | string;

export interface UpstreamRecord {
  guid?: string;
  name: string;
  method?: string;
  extraConfig?: string;
}

export interface UpstreamServer {
  guid?: string;
  upstreamGuid?: string;
  address: string;
  weight?: number;
  maxFails?: number;
  failTimeout?: string;
  backup?: boolean;
  down?: boolean;
  sort?: number;
}

export interface UpstreamDetail {
  upstream: UpstreamRecord;
  servers: UpstreamServer[];
}

export interface UpstreamServerHealth {
  serverGuid: string;
  address: string;
  healthy: boolean;
  message: string;
  latencyMs: number;
}

export interface UpstreamHealthResult {
  upstreamGuid: string;
  name: string;
  healthy: boolean;
  checkedAt: number;
  servers: UpstreamServerHealth[];
}

export interface UpstreamListQuery {
  page: number;
  size: number;
  content: string;
  [key: string]: string | number | boolean | undefined;
}

@Injectable({ providedIn: 'root' })
export class UpstreamService {
  private readonly http = inject(HttpClient);

  list(query: UpstreamListQuery): Observable<PageResult<UpstreamRecord>> {
    return this.http.get<PageResult<UpstreamRecord>>('/upstreams/list', { params: this.params(query) });
  }

  detail(id: UpstreamId): Observable<UpstreamDetail> {
    return this.http.get<UpstreamDetail>(`/upstreams/${id}`);
  }

  create(upstream: UpstreamRecord): Observable<boolean> {
    return this.http.post<boolean>('/upstreams', upstream);
  }

  update(upstream: UpstreamRecord): Observable<boolean> {
    return this.http.put<boolean>(`/upstreams/${upstream.guid}`, upstream);
  }

  delete(id: UpstreamId): Observable<boolean> {
    return this.http.delete<boolean>(`/upstreams/${id}`);
  }

  health(id: UpstreamId): Observable<UpstreamHealthResult> {
    return this.http.get<UpstreamHealthResult>(`/upstreams/${id}/health`);
  }

  createServer(upstreamGuid: string, server: UpstreamServer): Observable<boolean> {
    return this.http.post<boolean>(`/upstreams/${upstreamGuid}/servers`, server);
  }

  updateServer(upstreamGuid: string, server: UpstreamServer): Observable<boolean> {
    return this.http.put<boolean>(`/upstreams/${upstreamGuid}/servers/${server.guid}`, server);
  }

  deleteServer(upstreamGuid: string, serverGuid: string): Observable<boolean> {
    return this.http.delete<boolean>(`/upstreams/${upstreamGuid}/servers/${serverGuid}`);
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
