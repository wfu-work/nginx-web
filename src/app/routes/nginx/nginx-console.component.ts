import { DecimalPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
  inject,
} from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { SHARED_IMPORTS, TitleLabelComponent } from '@shared';
import { PageResult } from '@shared/types/page';
import { NzMessageService } from 'ng-zorro-antd/message';
import { catchError, finalize, forkJoin, map, of, switchMap } from 'rxjs';

import {
  Certificate,
  ConfigDiffResult,
  ConfigRenderResult,
  ConfigValidateResult,
  ConfigVersion,
  LocationRule,
  MetricSummary,
  NginxApiService,
  OperationResult,
  PublishResult,
  RuntimeSetting,
  Site,
  Upstream,
  UpstreamServer,
} from './nginx-api.service';
import { NodeRecord, NodeService } from './nodes/node.service';

type Section = 'dashboard' | 'sites' | 'upstreams' | 'certificates' | 'configs' | 'settings';
type PlainRow = Record<string, unknown>;

interface ConsoleNav {
  key: Section;
  title: string;
  desc: string;
  icon: string;
}

interface DashboardMetricItem {
  label: string;
  value: string;
  hint: string;
  icon: string;
  tone: 'primary' | 'success' | 'warning' | 'plain';
}

interface DashboardResourceItem {
  label: string;
  value: string;
  hint: string;
  icon: string;
  link: string;
}

@Component({
  selector: 'app-nginx-console',
  templateUrl: './nginx-console.component.html',
  styleUrls: ['./nginx-console.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SHARED_IMPORTS, TitleLabelComponent, DecimalPipe],
})
export class NginxConsoleComponent implements OnInit {
  private readonly api = inject(NginxApiService);
  private readonly nodeService = inject(NodeService);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly message = inject(NzMessageService);

  protected section: Section = 'dashboard';
  protected loading = false;
  protected summary: MetricSummary | null = null;
  protected operations: OperationResult[] = [];
  protected nodes: NodeRecord[] = [];
  protected selectedNodeGuid = '';
  protected sites: Site[] = [];
  protected selectedSiteLocations: LocationRule[] = [];
  protected upstreams: Upstream[] = [];
  protected selectedUpstreamServers: UpstreamServer[] = [];
  protected certificates: Certificate[] = [];
  protected versions: PlainRow[] = [];
  protected tasks: PlainRow[] = [];
  protected settings: RuntimeSetting[] = [];
  protected renderedConfig = '';
  protected validateResult: ConfigValidateResult | null = null;
  protected publishResult: PublishResult | null = null;
  protected diffResult: ConfigDiffResult | null = null;
  protected selectedVersion: ConfigVersion | null = null;
  protected upstreamHealth: unknown = null;

  protected readonly navs: ConsoleNav[] = [
    { key: 'dashboard', title: '运行总览', desc: '状态、指标和高危操作', icon: 'dashboard' },
    { key: 'sites', title: '站点', desc: '域名、目录和代理规则', icon: 'partition' },
    { key: 'upstreams', title: '上游', desc: '负载均衡和健康检查', icon: 'cluster' },
    {
      key: 'certificates',
      title: '证书',
      desc: 'HTTPS 证书路径与续期',
      icon: 'safety-certificate',
    },
    { key: 'configs', title: '发布', desc: '预览、校验、发布、回滚', icon: 'deployment-unit' },
    { key: 'settings', title: '设置', desc: '运行时 key-value 配置', icon: 'setting' },
  ];

  protected readonly siteForm = this.fb.nonNullable.group({
    guid: [''],
    name: ['默认站点', [Validators.required]],
    serverName: ['example.local', [Validators.required]],
    listen: ['80'],
    enabled: [true],
    root: [''],
    index: ['index.html index.htm'],
    accessLog: [''],
    errorLog: [''],
    certificateGuid: [''],
    ssl: [false],
    extraConfig: [''],
  });

  protected readonly locationForm = this.fb.nonNullable.group({
    guid: [''],
    siteGuid: [''],
    path: ['/'],
    proxyPass: ['http://127.0.0.1:8080'],
    root: [''],
    extraConfig: [''],
    sort: [0],
  });

  protected readonly upstreamForm = this.fb.nonNullable.group({
    guid: [''],
    name: ['backend_pool', [Validators.required]],
    method: [''],
    extraConfig: [''],
  });

  protected readonly upstreamServerForm = this.fb.nonNullable.group({
    guid: [''],
    upstreamGuid: [''],
    address: ['127.0.0.1:8080', [Validators.required]],
    weight: [1],
    maxFails: [3],
    failTimeout: ['30s'],
    backup: [false],
    down: [false],
    sort: [0],
  });

  protected readonly certificateForm = this.fb.nonNullable.group({
    guid: [''],
    name: ['example.local', [Validators.required]],
    serverName: ['example.local'],
    certPath: ['/etc/nginx/ssl/example.crt', [Validators.required]],
    keyPath: ['/etc/nginx/ssl/example.key', [Validators.required]],
    issuer: [''],
    notBefore: [0],
    notAfter: [0],
    autoRenew: [false],
    description: [''],
  });

  protected readonly configForm = this.fb.nonNullable.group({
    siteGuid: [''],
    reason: ['前端控制台发布'],
    config: [''],
    versionGuid: [''],
    confirm: [true],
    save: [false],
  });

  protected readonly diffForm = this.fb.nonNullable.group({
    fromVersionGuid: [''],
    toVersionGuid: [''],
    fromConfig: [''],
    toConfig: [''],
  });

  protected readonly settingForm = this.fb.nonNullable.group({
    guid: [''],
    key: ['nginx.stub-status-url', [Validators.required]],
    value: [''],
    description: [''],
  });

  protected get currentNav(): ConsoleNav {
    return this.navs.find((item) => item.key === this.section) || this.navs[0];
  }

  ngOnInit(): void {
    this.locationForm.controls.siteGuid.valueChanges.subscribe((siteGuid) =>
      this.loadSiteDetail(siteGuid),
    );
    this.upstreamServerForm.controls.upstreamGuid.valueChanges.subscribe((upstreamGuid) =>
      this.loadUpstreamDetail(upstreamGuid),
    );
    this.route.paramMap.subscribe((params) => {
      const section = (params.get('section') || 'dashboard') as Section;
      this.section = this.navs.some((item) => item.key === section) ? section : 'dashboard';
      this.load();
    });
  }

  protected load(): void {
    if (this.section === 'dashboard') this.loadDashboard();
    if (this.section === 'sites') this.loadSites();
    if (this.section === 'upstreams') this.loadUpstreams();
    if (this.section === 'certificates') this.loadCertificates();
    if (this.section === 'configs') this.loadConfigs();
    if (this.section === 'settings') this.loadSettings();
  }

  protected runOperation(action: string, confirm = false): void {
    const nodeGuid = this.selectedNodeGuid;
    if (!this.canRunNodeTask()) {
      this.message.warning('请先选择一个在线 Agent 节点');
      return;
    }
    this.loading = true;
    this.api
      .operation(action, {
        nodeGuid,
        confirm,
        reason: `frontend:${action}:${this.currentNodeTitle()}`,
      })
      .pipe(finalize(() => this.finishLoading()))
      .subscribe({
        next: (result) => {
          if (result.success) this.message.success(result.message || `${action} 已执行`);
          else this.message.warning(result.message || `${action} 执行失败`);
          this.loadDashboard();
        },
        error: (err) => this.message.error(err?.msg || err?.message || `${action} 执行失败`),
      });
  }

  protected saveSite(): void {
    if (this.rejectInvalid(this.siteForm)) return;
    this.api.saveSite(this.siteForm.getRawValue()).subscribe({
      next: () => {
        this.message.success('站点已保存');
        this.siteForm.patchValue({ guid: '' });
        this.selectedSiteLocations = [];
        this.loadSites();
      },
      error: (err) => this.handleError(err, '站点保存失败'),
    });
  }

  protected editSite(item: Site): void {
    this.siteForm.patchValue({ ...item, enabled: item.enabled ?? true, ssl: item.ssl ?? false });
    this.locationForm.patchValue({ siteGuid: item.guid || '' });
    this.configForm.patchValue({ siteGuid: item.guid || '' });
    this.loadSiteDetail(item.guid);
  }

  protected toggleSite(item: Site): void {
    if (!item.guid) return;
    this.api.toggleSite(item.guid, !item.enabled).subscribe({ next: () => this.loadSites() });
  }

  protected deleteSite(guid?: string): void {
    if (!guid) return;
    this.api.deleteSite(guid).subscribe({
      next: () => {
        this.selectedSiteLocations = [];
        this.loadSites();
      },
    });
  }

  protected createLocation(): void {
    const value = this.locationForm.getRawValue();
    if (!value.siteGuid) {
      this.message.warning('请先选择一个站点');
      return;
    }
    const request = value.guid
      ? this.api.updateLocation(value.siteGuid, value)
      : this.api.createLocation(value.siteGuid, value);
    request.subscribe({
      next: () => {
        this.message.success(value.guid ? 'Location 已更新' : 'Location 已添加');
        this.locationForm.patchValue({ guid: '', path: '/', proxyPass: 'http://127.0.0.1:8080' });
        this.loadSiteDetail(value.siteGuid);
      },
      error: (err) => this.handleError(err, 'Location 保存失败'),
    });
  }

  protected editLocation(item: LocationRule): void {
    this.locationForm.patchValue({
      ...item,
      siteGuid: item.siteGuid || this.siteForm.controls.guid.value,
    });
  }

  protected deleteLocation(item: LocationRule): void {
    const siteGuid = item.siteGuid || this.siteForm.controls.guid.value;
    if (!siteGuid || !item.guid) return;
    this.api.deleteLocation(siteGuid, item.guid).subscribe({
      next: () => {
        this.message.success('Location 已删除');
        this.loadSiteDetail(siteGuid);
      },
    });
  }

  protected saveUpstream(): void {
    if (this.rejectInvalid(this.upstreamForm)) return;
    this.api.saveUpstream(this.upstreamForm.getRawValue()).subscribe({
      next: () => {
        this.message.success('上游已保存');
        this.upstreamForm.patchValue({ guid: '' });
        this.selectedUpstreamServers = [];
        this.loadUpstreams();
      },
      error: (err) => this.handleError(err, '上游保存失败'),
    });
  }

  protected editUpstream(item: Upstream): void {
    this.upstreamForm.patchValue(item);
    this.upstreamServerForm.patchValue({ upstreamGuid: item.guid || '' });
    this.loadUpstreamDetail(item.guid);
  }

  protected deleteUpstream(guid?: string): void {
    if (!guid) return;
    this.api.deleteUpstream(guid).subscribe({
      next: () => {
        this.selectedUpstreamServers = [];
        this.loadUpstreams();
      },
    });
  }

  protected createUpstreamServer(): void {
    const value = this.upstreamServerForm.getRawValue();
    if (!value.upstreamGuid) {
      this.message.warning('请先选择一个上游');
      return;
    }
    const request = value.guid
      ? this.api.updateUpstreamServer(value.upstreamGuid, value)
      : this.api.createUpstreamServer(value.upstreamGuid, value);
    request.subscribe({
      next: () => {
        this.message.success(value.guid ? '上游节点已更新' : '上游节点已添加');
        this.upstreamServerForm.patchValue({ guid: '', address: '127.0.0.1:8080' });
        this.loadUpstreamDetail(value.upstreamGuid);
        this.health(value.upstreamGuid);
      },
      error: (err) => this.handleError(err, '上游节点保存失败'),
    });
  }

  protected editUpstreamServer(item: UpstreamServer): void {
    this.upstreamServerForm.patchValue({
      ...item,
      upstreamGuid: item.upstreamGuid || this.upstreamForm.controls.guid.value,
    });
  }

  protected deleteUpstreamServer(item: UpstreamServer): void {
    const upstreamGuid = item.upstreamGuid || this.upstreamForm.controls.guid.value;
    if (!upstreamGuid || !item.guid) return;
    this.api.deleteUpstreamServer(upstreamGuid, item.guid).subscribe({
      next: () => {
        this.message.success('上游节点已删除');
        this.loadUpstreamDetail(upstreamGuid);
      },
    });
  }

  protected health(guid?: string): void {
    if (!guid) return;
    this.api.upstreamHealth(guid).subscribe({
      next: (data) => {
        this.upstreamHealth = data;
        this.cdr.markForCheck();
      },
    });
  }

  protected saveCertificate(): void {
    if (this.rejectInvalid(this.certificateForm)) return;
    this.api.saveCertificate(this.certificateForm.getRawValue()).subscribe({
      next: () => {
        this.message.success('证书已保存');
        this.certificateForm.patchValue({ guid: '' });
        this.loadCertificates();
      },
      error: (err) => this.handleError(err, '证书保存失败'),
    });
  }

  protected editCertificate(item: Certificate): void {
    this.certificateForm.patchValue({
      ...item,
      notBefore: item.notBefore || 0,
      notAfter: item.notAfter || 0,
      autoRenew: item.autoRenew ?? false,
    });
  }

  protected deleteCertificate(guid?: string): void {
    if (!guid) return;
    this.api.deleteCertificate(guid).subscribe({
      next: () => {
        this.message.success('证书已删除');
        this.loadCertificates();
      },
    });
  }

  protected renderConfig(): void {
    const payload = this.configForm.getRawValue();
    this.api.renderConfig(payload).subscribe({
      next: (result: ConfigRenderResult) => {
        this.renderedConfig = result.config;
        this.configForm.patchValue({
          config: result.config,
          versionGuid: result.versionGuid || this.configForm.controls.versionGuid.value,
        });
        this.message.success('配置已生成');
        this.cdr.markForCheck();
      },
      error: (err) => this.handleError(err, '配置生成失败'),
    });
  }

  protected validateConfig(): void {
    this.api.validateConfig(this.configForm.getRawValue()).subscribe({
      next: (result) => {
        this.validateResult = result;
        if (result.versionGuid) this.configForm.patchValue({ versionGuid: result.versionGuid });
        if (result.success) this.message.success(result.message);
        else this.message.warning(result.message);
        this.cdr.markForCheck();
      },
      error: (err) => this.handleError(err, '配置校验失败'),
    });
  }

  protected publishConfig(): void {
    this.api.publishConfig(this.configForm.getRawValue()).subscribe({
      next: (result) => {
        this.publishResult = result;
        if (result.success) this.message.success(result.message);
        else this.message.warning(result.message);
        this.loadConfigs();
      },
      error: (err) => this.handleError(err, '配置发布失败'),
    });
  }

  protected diffConfig(): void {
    this.api.diffConfig(this.diffForm.getRawValue()).subscribe({
      next: (result) => {
        this.diffResult = result;
        this.message.success('Diff 已生成');
        this.cdr.markForCheck();
      },
      error: (err) => this.handleError(err, 'Diff 生成失败'),
    });
  }

  protected useVersionForDiff(versionGuid: unknown, side: 'from' | 'to'): void {
    if (!versionGuid) return;
    if (side === 'from') this.diffForm.patchValue({ fromVersionGuid: String(versionGuid) });
    else this.diffForm.patchValue({ toVersionGuid: String(versionGuid) });
  }

  protected loadVersion(
    versionGuid: unknown,
    target: 'preview' | 'publish' | 'diffFrom' | 'diffTo' = 'preview',
  ): void {
    if (!versionGuid) return;
    this.api.version(String(versionGuid)).subscribe({
      next: (version) => {
        const config = version.config || '';
        this.selectedVersion = version;
        if (target === 'publish') {
          this.configForm.patchValue({
            versionGuid: version.guid || '',
            siteGuid: version.siteGuid || '',
            config,
          });
        }
        if (target === 'diffFrom') {
          this.diffForm.patchValue({ fromVersionGuid: version.guid || '', fromConfig: config });
        }
        if (target === 'diffTo') {
          this.diffForm.patchValue({ toVersionGuid: version.guid || '', toConfig: config });
        }
        this.cdr.markForCheck();
      },
      error: (err) => this.handleError(err, '版本详情加载失败'),
    });
  }

  protected rollback(versionGuid: unknown): void {
    if (!versionGuid) return;
    this.api
      .rollback({
        versionGuid,
        confirm: true,
        reason: '前端控制台回滚',
      })
      .subscribe({
        next: (result) => {
          this.publishResult = result;
          this.message.success(result.message || '已发起回滚');
        },
      });
  }

  protected saveSetting(): void {
    if (this.rejectInvalid(this.settingForm)) return;
    this.api.saveSetting(this.settingForm.getRawValue()).subscribe({
      next: () => {
        this.message.success('设置已保存');
        this.settingForm.patchValue({ guid: '' });
        this.loadSettings();
      },
      error: (err) => this.handleError(err, '设置保存失败'),
    });
  }

  protected editSetting(item: RuntimeSetting): void {
    this.settingForm.patchValue(item);
  }

  protected deleteSetting(guid?: string): void {
    if (!guid) return;
    this.api.deleteSetting(guid).subscribe({
      next: () => {
        this.message.success('设置已删除');
        this.loadSettings();
      },
      error: (err) => this.handleError(err, '设置删除失败'),
    });
  }

  protected formatTime(value?: number | unknown): string {
    if (!value || typeof value !== 'number') return '-';
    return new Date(value).toLocaleString();
  }

  protected asText(value: unknown): string {
    if (value === undefined || value === null || value === '') return '-';
    if (typeof value === 'object') return JSON.stringify(value, null, 2);
    return String(value);
  }

  protected dashboardMetrics(): DashboardMetricItem[] {
    const noNode = !this.selectedNodeGuid;
    const status = this.summary?.status;
    const stubStatus = this.summary?.stubStatus;
    return [
      {
        label: '运行状态',
        value: noNode ? '未选择' : status?.running ? '运行中' : '未运行',
        hint: noNode ? '请选择在线 Agent 节点' : status?.message || '等待 Agent 响应',
        icon: !noNode && status?.running ? 'check-circle' : 'warning',
        tone: !noNode && status?.running ? 'success' : 'warning',
      },
      {
        label: '活跃连接',
        value: this.countText(stubStatus?.active),
        hint: `reading ${this.countText(stubStatus?.reading)} / waiting ${this.countText(stubStatus?.waiting)}`,
        icon: 'api',
        tone: 'primary',
      },
      {
        label: '累计请求',
        value: this.countText(stubStatus?.requests),
        hint: `accepted ${this.countText(stubStatus?.accepts)} / handled ${this.countText(stubStatus?.handled)}`,
        icon: 'bar-chart',
        tone: 'plain',
      },
      {
        label: '进程数量',
        value: this.countText(status?.processes?.length),
        hint: this.processSummary(),
        icon: 'cluster',
        tone: 'plain',
      },
    ];
  }

  protected agentNodes(): NodeRecord[] {
    return this.nodes.filter((node) => node.accessMode === 'agent' && node.enabled !== false);
  }

  protected currentNode(): NodeRecord | null {
    return this.agentNodes().find((node) => node.guid === this.selectedNodeGuid) || null;
  }

  protected currentNodeTitle(): string {
    const node = this.currentNode();
    return node?.name || node?.agentId || node?.guid || '请选择 Agent 节点';
  }

  protected currentNodeMeta(): string {
    const node = this.currentNode();
    if (!node) return '工作台只操作 Agent 接入的 Nginx 节点';
    return [node.agentId, node.address, node.version ? `Agent ${node.version}` : '']
      .filter(Boolean)
      .join(' / ');
  }

  protected canRunNodeTask(): boolean {
    const node = this.currentNode();
    return Boolean(node?.guid && node.enabled !== false && node.status === 'online');
  }

  protected nodeLabel(node: NodeRecord): string {
    const name = node.name || node.agentId || node.guid || 'Agent 节点';
    const status = node.status === 'online' ? '在线' : '离线';
    return `${name} · ${status}`;
  }

  protected selectNode(nodeGuid: string): void {
    this.selectedNodeGuid = nodeGuid;
    this.summary = null;
    this.operations = [];
    if (nodeGuid) {
      this.loadDashboard();
    } else {
      this.cdr.markForCheck();
    }
  }

  protected dashboardResources(): DashboardResourceItem[] {
    return [
      {
        label: '站点配置',
        value: this.countText(this.sites.length),
        hint: this.enabledSiteText(),
        icon: 'appstore',
        link: '/nginx/sites',
      },
      {
        label: '上游服务',
        value: this.countText(this.upstreams.length),
        hint: '反向代理目标池',
        icon: 'deployment-unit',
        link: '/nginx/upstreams',
      },
      {
        label: '证书管理',
        value: this.countText(this.certificates.length),
        hint: this.expiringCertText(),
        icon: 'safety-certificate',
        link: '/nginx/certificates',
      },
      {
        label: '版本历史',
        value: this.countText(this.versions.length),
        hint: this.latestVersionText(),
        icon: 'history',
        link: '/configs/versions',
      },
    ];
  }

  protected operationText(action?: string): string {
    const map: Record<string, string> = {
      test: '配置测试',
      reload: 'Reload',
      start: '启动',
      restart: '重启',
      stop: '停止',
    };
    return action ? map[action] || action : '-';
  }

  protected operationIcon(action?: string): string {
    const map: Record<string, string> = {
      test: 'experiment',
      reload: 'reload',
      start: 'play-circle',
      restart: 'sync',
      stop: 'poweroff',
    };
    return action ? map[action] || 'thunderbolt' : 'thunderbolt';
  }

  protected countText(value?: number | null): string {
    if (value === undefined || value === null || !Number.isFinite(value)) return '-';
    return value.toLocaleString('zh-CN');
  }

  protected processSummary(): string {
    if (!this.selectedNodeGuid) return '未选择 Agent 节点';
    const processes = this.summary?.status?.processes || [];
    if (!processes.length) return this.summary?.status?.mode || '未检测到进程';
    const memory = processes.reduce((total, item) => total + (item.memoryMb || 0), 0);
    return `${this.summary?.status?.mode || 'Agent'} / ${memory.toFixed(1)} MB`;
  }

  private loadDashboard(): void {
    this.loading = true;
    forkJoin({
      nodes: this.nodeService
        .list({ page: 1, size: 100, keyword: '', status: '', enabled: '', desc: 'last_seen_at' })
        .pipe(catchError(() => of(emptyPage<NodeRecord>()))),
      sites: this.api.sites({ page: 1, size: 100 }).pipe(catchError(() => of(emptyPage<Site>()))),
      upstreams: this.api
        .upstreams({ page: 1, size: 100 })
        .pipe(catchError(() => of(emptyPage<Upstream>()))),
      certificates: this.api
        .certificates({ page: 1, size: 100 })
        .pipe(catchError(() => of(emptyPage<Certificate>()))),
      versions: this.api
        .versions({ page: 1, size: 8, desc: 'create_time' })
        .pipe(catchError(() => of(emptyPage<PlainRow>()))),
    })
      .pipe(
        switchMap((base) => {
          this.nodes = base.nodes.data || [];
          this.ensureSelectedNode();
          const nodeGuid = this.selectedNodeGuid;
          if (!nodeGuid) {
            return of({
              ...base,
              summary: null,
              operations: emptyPage<OperationResult>(),
            });
          }
          return forkJoin({
            summary: this.api.summary({ nodeGuid }).pipe(catchError(() => of(null))),
            operations: this.api
              .operations({ page: 1, size: 8, desc: 'create_time', nodeGuid })
              .pipe(catchError(() => of(emptyPage<OperationResult>()))),
          }).pipe(map((runtime) => ({ ...base, ...runtime })));
        }),
      )
      .pipe(finalize(() => this.finishLoading()))
      .subscribe(({ summary, operations, sites, upstreams, certificates, versions }) => {
        this.summary = summary;
        this.operations = operations.data || [];
        this.sites = sites.data || [];
        this.upstreams = upstreams.data || [];
        this.certificates = certificates.data || [];
        this.versions = versions.data || [];
      });
  }

  private ensureSelectedNode(): void {
    const nodes = this.agentNodes();
    const selected = nodes.find((node) => node.guid === this.selectedNodeGuid);
    if (selected?.status === 'online') return;
    this.selectedNodeGuid = nodes.find((node) => node.status === 'online')?.guid || '';
  }

  private loadSites(): void {
    this.loading = true;
    forkJoin({
      sites: this.api.sites({ page: 1, size: 100 }).pipe(catchError(() => of(emptyPage<Site>()))),
      certificates: this.api
        .certificates({ page: 1, size: 100 })
        .pipe(catchError(() => of(emptyPage<Certificate>()))),
    })
      .pipe(finalize(() => this.finishLoading()))
      .subscribe(({ sites, certificates }) => {
        this.sites = sites.data || [];
        this.certificates = certificates.data || [];
      });
  }

  private loadSiteDetail(guid?: string): void {
    if (!guid) return;
    this.api.siteDetail(guid).subscribe({
      next: (result) => {
        this.selectedSiteLocations = result.locations || [];
        this.cdr.markForCheck();
      },
    });
  }

  private loadUpstreams(): void {
    this.loading = true;
    this.api
      .upstreams({ page: 1, size: 100 })
      .pipe(finalize(() => this.finishLoading()))
      .subscribe((result) => {
        this.upstreams = result.data || [];
      });
  }

  private loadUpstreamDetail(guid?: string): void {
    if (!guid) return;
    this.api.upstreamDetail(guid).subscribe({
      next: (result) => {
        this.selectedUpstreamServers = result.servers || [];
        this.cdr.markForCheck();
      },
    });
  }

  private loadCertificates(): void {
    this.loading = true;
    this.api
      .certificates({ page: 1, size: 100 })
      .pipe(finalize(() => this.finishLoading()))
      .subscribe((result) => {
        this.certificates = result.data || [];
      });
  }

  private loadConfigs(): void {
    this.loading = true;
    forkJoin({
      sites: this.api.sites({ page: 1, size: 100 }).pipe(catchError(() => of(emptyPage<Site>()))),
      versions: this.api
        .versions({ page: 1, size: 10 })
        .pipe(catchError(() => of(emptyPage<PlainRow>()))),
      tasks: this.api
        .tasks({ page: 1, size: 10 })
        .pipe(catchError(() => of(emptyPage<PlainRow>()))),
    })
      .pipe(finalize(() => this.finishLoading()))
      .subscribe(({ sites, versions, tasks }) => {
        this.sites = sites.data || [];
        this.versions = versions.data || [];
        this.tasks = tasks.data || [];
      });
  }

  private loadSettings(): void {
    this.loading = true;
    this.api
      .settings({ page: 1, size: 100 })
      .pipe(finalize(() => this.finishLoading()))
      .subscribe((result) => {
        this.settings = result.data || [];
      });
  }

  private finishLoading(): void {
    this.loading = false;
    this.cdr.markForCheck();
  }

  private rejectInvalid(form: FormGroup): boolean {
    if (!form.invalid) return false;
    Object.values(form.controls).forEach((control) => {
      control.markAsDirty();
      control.updateValueAndValidity({ onlySelf: true });
    });
    this.message.warning('请先补齐必填项');
    return true;
  }

  private handleError(err: unknown, fallback: string): void {
    const error = err as {
      error?: { msg?: string; message?: string };
      msg?: string;
      message?: string;
    };
    this.message.error(
      error?.error?.msg || error?.error?.message || error?.msg || error?.message || fallback,
    );
    this.cdr.markForCheck();
  }

  private enabledSiteText(): string {
    const enabled = this.sites.filter((item) => item.enabled !== false).length;
    return `${this.countText(enabled)} 个启用站点`;
  }

  private expiringCertText(): string {
    const now = Date.now();
    const thirtyDays = now + 30 * 24 * 60 * 60 * 1000;
    const expiring = this.certificates.filter(
      (item) => item.notAfter && item.notAfter > now && item.notAfter <= thirtyDays,
    ).length;
    if (expiring) return `${expiring} 张 30 天内到期`;
    return '证书路径与续期';
  }

  private latestVersionText(): string {
    const latest = this.versions[0];
    if (!latest) return '暂无版本记录';
    return `最新 v${latest['versionNo'] || '-'} / ${latest['status'] || '-'}`;
  }
}

function emptyPage<T>(): PageResult<T> {
  return { data: [], total: 0, page: 1, size: 10 };
}
