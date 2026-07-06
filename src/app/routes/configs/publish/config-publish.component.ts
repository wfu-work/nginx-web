import { Component, OnInit, inject, signal } from '@angular/core';
import { SHARED_IMPORTS, TitleLabelComponent } from '@shared';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { forkJoin } from 'rxjs';

import { NodeRecord, NodeService } from '../../nginx/nodes/node.service';
import { SiteRecord, SiteService } from '../../nginx/sites/site.service';
import {
  ConfigPublishPayload,
  ConfigRenderPayload,
  ConfigService,
  ConfigValidatePayload,
  ConfigValidateResult,
  ConfigVersion,
  PublishResult,
} from '../config.service';

@Component({
  selector: 'nginx-config-publish',
  imports: [SHARED_IMPORTS, TitleLabelComponent, NzTagModule],
  templateUrl: './config-publish.component.html',
  styleUrls: ['./config-publish.component.less'],
})
export class ConfigPublishComponent implements OnInit {
  private readonly configService = inject(ConfigService);
  private readonly nodeService = inject(NodeService);
  private readonly siteService = inject(SiteService);
  private readonly message = inject(NzMessageService);

  protected readonly sites = signal<SiteRecord[]>([]);
  protected readonly nodes = signal<NodeRecord[]>([]);
  protected readonly versions = signal<ConfigVersion[]>([]);
  protected readonly loading = signal(false);
  protected readonly rendering = signal(false);
  protected readonly validating = signal(false);
  protected readonly publishing = signal(false);
  protected readonly validateResult = signal<ConfigValidateResult | null>(null);
  protected readonly publishResult = signal<PublishResult | null>(null);

  protected readonly model = {
    nodeGuid: '',
    siteGuid: '',
    versionGuid: '',
    reason: '配置发布',
    config: '',
    save: true,
  };

  ngOnInit(): void {
    this.loadOptions();
  }

  protected refresh(): void {
    this.loadOptions();
  }

  protected renderConfig(): void {
    const payload: ConfigRenderPayload = {
      siteGuid: this.model.siteGuid,
      save: false,
      reason: this.model.reason,
    };
    this.rendering.set(true);
    this.configService.render(payload).subscribe({
      next: (result) => {
        this.model.config = result.config;
        this.model.versionGuid = '';
        this.message.success('配置已生成');
      },
      complete: () => this.rendering.set(false),
      error: () => this.rendering.set(false),
    });
  }

  protected loadVersion(): void {
    if (!this.model.versionGuid) return;
    this.configService.version(this.model.versionGuid).subscribe({
      next: (version) => {
        this.model.siteGuid = version.siteGuid || '';
        this.model.config = version.config || '';
        this.message.success(`已载入 v${version.versionNo || '-'}`);
      },
    });
  }

  protected validateConfig(): void {
    if (!this.ensureNode()) return;
    const payload: ConfigValidatePayload = {
      nodeGuid: this.model.nodeGuid,
      siteGuid: this.model.siteGuid,
      config: this.model.config,
      save: this.model.save,
      reason: this.model.reason,
    };
    this.validating.set(true);
    this.configService.validate(payload).subscribe({
      next: (result) => {
        this.validateResult.set(result);
        if (result.versionGuid) this.model.versionGuid = result.versionGuid;
        if (result.success) this.message.success(result.message || '配置校验通过');
        else this.message.warning(result.message || '配置校验失败');
        this.loadVersions();
      },
      complete: () => this.validating.set(false),
      error: () => this.validating.set(false),
    });
  }

  protected publishConfig(): void {
    if (!this.ensureNode()) return;
    const payload: ConfigPublishPayload = {
      nodeGuid: this.model.nodeGuid,
      versionGuid: this.model.versionGuid,
      siteGuid: this.model.siteGuid,
      config: this.model.config,
      reason: this.model.reason,
    };
    this.publishing.set(true);
    this.configService.publish(payload).subscribe({
      next: (result) => {
        this.publishResult.set(result);
        if (result.success) this.message.success(result.message || '配置发布成功');
        else this.message.warning(result.message || '配置发布失败');
        this.loadVersions();
      },
      complete: () => this.publishing.set(false),
      error: () => this.publishing.set(false),
    });
  }

  protected canRunNodeTask(): boolean {
    return !!this.model.nodeGuid;
  }

  protected nodeLabel(node: NodeRecord): string {
    const name = node.name || node.agentId || node.guid || '-';
    const status = node.status === 'online' ? '在线' : '离线';
    return `${name} / ${node.agentId || 'Agent'} / ${status}`;
  }

  protected versionLabel(version: ConfigVersion): string {
    return `v${version.versionNo || '-'} / ${this.statusText(version.status)} / ${version.reason || '无说明'}`;
  }

  protected statusText(status?: string): string {
    const map: Record<string, string> = {
      rendered: '已生成',
      validated: '已校验',
      published: '已发布',
      rolled_back: '已回滚',
    };
    return status ? map[status] || status : '-';
  }

  protected statusColor(success?: boolean): string {
    if (success === true) return 'green';
    if (success === false) return 'red';
    return 'default';
  }

  protected asText(value: unknown): string {
    if (value === undefined || value === null || value === '') return '-';
    if (typeof value === 'object') return JSON.stringify(value, null, 2);
    return String(value);
  }

  private loadOptions(): void {
    this.loading.set(true);
    forkJoin({
      sites: this.siteService.list({ page: 1, size: 100, content: '' }),
      nodes: this.nodeService.list({
        page: 1,
        size: 100,
        keyword: '',
        status: '',
        enabled: 'true',
        desc: 'create_time',
      }),
      versions: this.configService.versions({
        page: 1,
        size: 100,
        content: '',
        desc: 'create_time',
      }),
    }).subscribe({
      next: ({ sites, nodes, versions }) => {
        this.sites.set(sites.data || []);
        this.nodes.set(nodes.data || []);
        this.versions.set(versions.data || []);
        this.selectDefaultNode();
      },
      complete: () => this.loading.set(false),
      error: () => this.loading.set(false),
    });
  }

  private loadVersions(): void {
    this.configService
      .versions({ page: 1, size: 100, content: '', desc: 'create_time' })
      .subscribe({
        next: (result) => this.versions.set(result.data || []),
      });
  }

  private selectDefaultNode(): void {
    if (this.model.nodeGuid || this.nodes().length === 0) return;
    const node = this.nodes().find((item) => item.status === 'online') || this.nodes()[0];
    this.model.nodeGuid = node.guid || '';
  }

  private ensureNode(): boolean {
    if (this.model.nodeGuid) return true;
    this.message.warning('请先选择目标 Agent 节点');
    return false;
  }
}
