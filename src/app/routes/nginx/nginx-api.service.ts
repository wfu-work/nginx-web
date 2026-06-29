import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { PageResult } from '@shared/types/page';
import { Observable } from 'rxjs';

export interface QueryParams {
  page?: number;
  size?: number;
  content?: string;
  keyword?: string;
  instanceGuid?: string;
  lines?: number;
  [key: string]: string | number | boolean | undefined;
}

export interface NginxInstance {
  guid?: string;
  name: string;
  nodeGuid?: string;
  mode: 'command' | 'systemd' | 'docker' | string;
  host?: string;
  serviceName?: string;
  bin?: string;
  systemctl?: string;
  mainConfig?: string;
  managedConfig?: string;
  dockerContainer?: string;
  accessLog?: string;
  errorLog?: string;
  stubStatusUrl?: string;
  enabled?: boolean;
  description?: string;
}

export interface NginxNode {
  guid?: string;
  name: string;
  accessMode: 'local' | 'agent' | string;
  agentId?: string;
  address?: string;
  labels?: string;
  status?: 'online' | 'offline' | string;
  version?: string;
  lastSeenAt?: number;
  enabled?: boolean;
  description?: string;
}

export interface Site {
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
  site: Site;
  locations: LocationRule[];
}

export interface Upstream {
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
  upstream: Upstream;
  servers: UpstreamServer[];
}

export interface Certificate {
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

export interface RuntimeSetting {
  guid?: string;
  key: string;
  value: string;
  description?: string;
}

export interface StatusResult {
  instanceGuid: string;
  mode: string;
  running: boolean;
  message: string;
  version: string;
  processes: ProcessStatus[];
  checkedAt: number;
}

export interface ProcessStatus {
  pid: number;
  name: string;
  cpuPercent: number;
  memoryMb: number;
}

export interface StubStatusResult {
  active: number;
  accepts: number;
  handled: number;
  requests: number;
  reading: number;
  writing: number;
  waiting: number;
}

export interface MetricSummary {
  instanceGuid: string;
  status: StatusResult;
  stubStatus?: StubStatusResult;
  checkedAt: number;
}

export interface OperationResult {
  operationGuid: string;
  action: string;
  success: boolean;
  message: string;
  command: string;
  output: string;
  durationMs: number;
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
  [key: string]: unknown;
}

export interface LogResult {
  path: string;
  lines: string[];
}

@Injectable({ providedIn: 'root' })
export class NginxApiService {
  private readonly http = inject(HttpClient);

  status(instanceGuid?: string): Observable<StatusResult> {
    return this.http.get<StatusResult>('/nginx/status', { params: this.params({ instanceGuid }) });
  }

  summary(instanceGuid?: string): Observable<MetricSummary> {
    return this.http.get<MetricSummary>('/metrics/summary', { params: this.params({ instanceGuid }) });
  }

  operation(action: string, payload: Record<string, unknown> = {}): Observable<OperationResult> {
    return this.http.post<OperationResult>(`/nginx/${action}`, payload);
  }

  operations(query: QueryParams = {}): Observable<PageResult<OperationResult>> {
    return this.http.get<PageResult<OperationResult>>('/nginx/operations/list', {
      params: this.params(query),
    });
  }

  instances(query: QueryParams = {}): Observable<PageResult<NginxInstance>> {
    return this.http.get<PageResult<NginxInstance>>('/nginx/instances/list', {
      params: this.params(query),
    });
  }

  saveInstance(payload: NginxInstance): Observable<boolean> {
    if (payload.guid) return this.http.put<boolean>(`/nginx/instances/${payload.guid}`, payload);
    return this.http.post<boolean>('/nginx/instances', payload);
  }

  deleteInstance(guid: string): Observable<boolean> {
    return this.http.delete<boolean>(`/nginx/instances/${guid}`);
  }

  nodes(query: QueryParams = {}): Observable<PageResult<NginxNode>> {
    return this.http.get<PageResult<NginxNode>>('/nodes/list', {
      params: this.params(query),
    });
  }

  saveNode(payload: NginxNode): Observable<boolean> {
    if (payload.guid) return this.http.put<boolean>(`/nodes/${payload.guid}`, payload);
    return this.http.post<boolean>('/nodes', payload);
  }

  deleteNode(guid: string): Observable<boolean> {
    return this.http.delete<boolean>(`/nodes/${guid}`);
  }

  sites(query: QueryParams = {}): Observable<PageResult<Site>> {
    return this.http.get<PageResult<Site>>('/sites/list', { params: this.params(query) });
  }

  siteDetail(guid: string): Observable<SiteDetail> {
    return this.http.get<SiteDetail>(`/sites/${guid}`);
  }

  saveSite(payload: Site): Observable<boolean> {
    if (payload.guid) return this.http.put<boolean>(`/sites/${payload.guid}`, payload);
    return this.http.post<boolean>('/sites', payload);
  }

  toggleSite(guid: string, enabled: boolean): Observable<boolean> {
    return this.http.post<boolean>(`/sites/${guid}/${enabled ? 'enable' : 'disable'}`, {});
  }

  deleteSite(guid: string): Observable<boolean> {
    return this.http.delete<boolean>(`/sites/${guid}`);
  }

  createLocation(siteGuid: string, payload: LocationRule): Observable<boolean> {
    return this.http.post<boolean>(`/sites/${siteGuid}/locations`, payload);
  }

  updateLocation(siteGuid: string, payload: LocationRule): Observable<boolean> {
    return this.http.put<boolean>(`/sites/${siteGuid}/locations/${payload.guid}`, payload);
  }

  deleteLocation(siteGuid: string, locationGuid: string): Observable<boolean> {
    return this.http.delete<boolean>(`/sites/${siteGuid}/locations/${locationGuid}`);
  }

  upstreams(query: QueryParams = {}): Observable<PageResult<Upstream>> {
    return this.http.get<PageResult<Upstream>>('/upstreams/list', { params: this.params(query) });
  }

  upstreamDetail(guid: string): Observable<UpstreamDetail> {
    return this.http.get<UpstreamDetail>(`/upstreams/${guid}`);
  }

  saveUpstream(payload: Upstream): Observable<boolean> {
    if (payload.guid) return this.http.put<boolean>(`/upstreams/${payload.guid}`, payload);
    return this.http.post<boolean>('/upstreams', payload);
  }

  deleteUpstream(guid: string): Observable<boolean> {
    return this.http.delete<boolean>(`/upstreams/${guid}`);
  }

  createUpstreamServer(upstreamGuid: string, payload: UpstreamServer): Observable<boolean> {
    return this.http.post<boolean>(`/upstreams/${upstreamGuid}/servers`, payload);
  }

  updateUpstreamServer(upstreamGuid: string, payload: UpstreamServer): Observable<boolean> {
    return this.http.put<boolean>(`/upstreams/${upstreamGuid}/servers/${payload.guid}`, payload);
  }

  deleteUpstreamServer(upstreamGuid: string, serverGuid: string): Observable<boolean> {
    return this.http.delete<boolean>(`/upstreams/${upstreamGuid}/servers/${serverGuid}`);
  }

  upstreamHealth(guid: string): Observable<unknown> {
    return this.http.get<unknown>(`/upstreams/${guid}/health`);
  }

  certificates(query: QueryParams = {}): Observable<PageResult<Certificate>> {
    return this.http.get<PageResult<Certificate>>('/certificates/list', { params: this.params(query) });
  }

  saveCertificate(payload: Certificate): Observable<boolean> {
    if (payload.guid) return this.http.put<boolean>(`/certificates/${payload.guid}`, payload);
    return this.http.post<boolean>('/certificates', payload);
  }

  deleteCertificate(guid: string): Observable<boolean> {
    return this.http.delete<boolean>(`/certificates/${guid}`);
  }

  renderConfig(payload: Record<string, unknown>): Observable<ConfigRenderResult> {
    return this.http.post<ConfigRenderResult>('/configs/render', payload);
  }

  validateConfig(payload: Record<string, unknown>): Observable<ConfigValidateResult> {
    return this.http.post<ConfigValidateResult>('/configs/validate', payload);
  }

  publishConfig(payload: Record<string, unknown>): Observable<PublishResult> {
    return this.http.post<PublishResult>('/configs/publish', payload);
  }

  rollback(payload: Record<string, unknown>): Observable<PublishResult> {
    return this.http.post<PublishResult>('/configs/rollback', payload);
  }

  diffConfig(payload: Record<string, unknown>): Observable<ConfigDiffResult> {
    return this.http.post<ConfigDiffResult>('/configs/diff', payload);
  }

  versions(query: QueryParams = {}): Observable<PageResult<Record<string, unknown>>> {
    return this.http.get<PageResult<Record<string, unknown>>>('/configs/versions/list', {
      params: this.params(query),
    });
  }

  version(guid: string): Observable<ConfigVersion> {
    return this.http.get<ConfigVersion>(`/configs/versions/${guid}`);
  }

  tasks(query: QueryParams = {}): Observable<PageResult<Record<string, unknown>>> {
    return this.http.get<PageResult<Record<string, unknown>>>('/configs/tasks/list', {
      params: this.params(query),
    });
  }

  logs(kind: 'access' | 'error', query: QueryParams = {}): Observable<LogResult> {
    return this.http.get<LogResult>(`/logs/${kind}/list`, { params: this.params(query) });
  }

  accessRecords(query: QueryParams = {}): Observable<PageResult<Record<string, unknown>>> {
    return this.http.get<PageResult<Record<string, unknown>>>('/logs/access/records', {
      params: this.params(query),
    });
  }

  errorRecords(query: QueryParams = {}): Observable<PageResult<Record<string, unknown>>> {
    return this.http.get<PageResult<Record<string, unknown>>>('/logs/error/records', {
      params: this.params(query),
    });
  }

  syncLogs(query: QueryParams = {}): Observable<Record<string, number>> {
    return this.http.post<Record<string, number>>('/logs/sync', null, { params: this.params(query) });
  }

  audit(query: QueryParams = {}): Observable<PageResult<Record<string, unknown>>> {
    return this.http.get<PageResult<Record<string, unknown>>>('/logs/audit/list', {
      params: this.params(query),
    });
  }

  settings(query: QueryParams = {}): Observable<PageResult<RuntimeSetting>> {
    return this.http.get<PageResult<RuntimeSetting>>('/settings/list', { params: this.params(query) });
  }

  saveSetting(payload: RuntimeSetting): Observable<boolean> {
    return this.http.post<boolean>('/settings', payload);
  }

  deleteSetting(guid: string): Observable<boolean> {
    return this.http.delete<boolean>(`/settings/${guid}`);
  }

  private params(query: QueryParams = {}): HttpParams {
    let params = new HttpParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') return;
      params = params.set(key, String(value));
    });
    return params;
  }
}
