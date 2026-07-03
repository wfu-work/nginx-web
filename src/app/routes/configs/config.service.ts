import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { PageResult } from '@shared/types/page';
import { Observable } from 'rxjs';

export type ConfigId = number | string;

export interface ConfigQuery {
  page: number;
  size: number;
  content?: string;
  desc?: string;
  [key: string]: string | number | boolean | undefined;
}

export interface ConfigRenderPayload {
  siteGuid: string;
  save: boolean;
  reason: string;
}

export interface ConfigValidatePayload {
  nodeGuid: string;
  siteGuid: string;
  config: string;
  save: boolean;
  reason: string;
}

export interface ConfigPublishPayload {
  nodeGuid: string;
  versionGuid: string;
  siteGuid: string;
  config: string;
  reason: string;
}

export interface ConfigRollbackPayload {
  nodeGuid: string;
  versionGuid: string;
  confirm: boolean;
  reason: string;
}

export interface ConfigDiffPayload {
  fromVersionGuid: string;
  toVersionGuid: string;
  fromConfig: string;
  toConfig: string;
}

export interface ConfigRenderResult {
  config: string;
  versionGuid?: string;
  versionNo?: number;
}

export interface ConfigValidateResult {
  versionGuid?: string;
  versionNo?: number;
  success: boolean;
  message: string;
  output: string;
  configPath: string;
  durationMs: number;
}

export interface PublishResult {
  taskGuid: string;
  versionGuid: string;
  operationGuid: string;
  success: boolean;
  message: string;
  targetPath: string;
  backupPath: string;
  durationMs: number;
}

export interface ConfigDiffResult {
  diffText: string;
  html: string;
}

export interface ConfigVersion {
  guid?: string;
  siteGuid?: string;
  versionNo?: number;
  status?: string;
  config?: string;
  validateOk?: boolean;
  validateMsg?: string;
  publishedAt?: number;
  rollbackFrom?: string;
  reason?: string;
  createTime?: number;
}

export interface PublishTask {
  guid?: string;
  versionGuid?: string;
  action?: string;
  success?: boolean;
  status?: string;
  targetPath?: string;
  backupPath?: string;
  message?: string;
  operationGuid?: string;
  durationMs?: number;
  reason?: string;
  createTime?: number;
}

@Injectable({ providedIn: 'root' })
export class ConfigService {
  private readonly http = inject(HttpClient);

  render(payload: ConfigRenderPayload): Observable<ConfigRenderResult> {
    return this.http.post<ConfigRenderResult>('/configs/render', payload);
  }

  validate(payload: ConfigValidatePayload): Observable<ConfigValidateResult> {
    return this.http.post<ConfigValidateResult>('/configs/validate', payload);
  }

  publish(payload: ConfigPublishPayload): Observable<PublishResult> {
    return this.http.post<PublishResult>('/configs/publish', payload);
  }

  rollback(payload: ConfigRollbackPayload): Observable<PublishResult> {
    return this.http.post<PublishResult>('/configs/rollback', payload);
  }

  diff(payload: ConfigDiffPayload): Observable<ConfigDiffResult> {
    return this.http.post<ConfigDiffResult>('/configs/diff', payload);
  }

  versions(query: ConfigQuery): Observable<PageResult<ConfigVersion>> {
    return this.http.get<PageResult<ConfigVersion>>('/configs/versions/list', {
      params: this.params(query),
    });
  }

  version(id: ConfigId): Observable<ConfigVersion> {
    return this.http.get<ConfigVersion>(`/configs/versions/${id}`);
  }

  tasks(query: ConfigQuery): Observable<PageResult<PublishTask>> {
    return this.http.get<PageResult<PublishTask>>('/configs/tasks/list', {
      params: this.params(query),
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
