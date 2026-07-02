import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { PageResult } from '@shared/types/page';
import { Observable } from 'rxjs';

export type NodeId = number | string;

export interface NodeRecord {
  guid?: string;
  name: string;
  accessMode: 'agent' | string;
  agentId?: string;
  address?: string;
  labels?: string;
  status?: 'online' | 'offline' | string;
  version?: string;
  lastSeenAt?: number;
  enabled?: boolean;
  description?: string;
}

export interface NodeListQuery {
  page: number;
  size: number;
  keyword: string;
  status: string;
  enabled: string;
  desc: string;
  [key: string]: string | number | boolean | undefined;
}

@Injectable({ providedIn: 'root' })
export class NodeService {
  private readonly http = inject(HttpClient);

  list(query: NodeListQuery): Observable<PageResult<NodeRecord>> {
    return this.http.get<PageResult<NodeRecord>>('/nodes/list', { params: this.params(query) });
  }

  detail(id: NodeId): Observable<NodeRecord> {
    return this.http.get<NodeRecord>(`/nodes/${id}`);
  }

  create(node: NodeRecord): Observable<boolean> {
    return this.http.post<boolean>('/nodes', node);
  }

  update(node: NodeRecord): Observable<boolean> {
    return this.http.put<boolean>(`/nodes/${node.guid}`, node);
  }

  delete(id: NodeId): Observable<boolean> {
    return this.http.delete<boolean>(`/nodes/${id}`);
  }

  private params(query: NodeListQuery): HttpParams {
    let params = new HttpParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') return;
      params = params.set(key, String(value));
    });
    return params;
  }
}
