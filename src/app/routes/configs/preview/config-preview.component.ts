import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { SHARED_IMPORTS, TitleLabelComponent } from '@shared';
import { NzMessageService } from 'ng-zorro-antd/message';
import { finalize } from 'rxjs';

import { SiteRecord, SiteService } from '../../nginx/sites/site.service';
import { ConfigRenderPayload, ConfigRenderResult, ConfigService } from '../config.service';

@Component({
  selector: 'nginx-config-preview',
  imports: [SHARED_IMPORTS, TitleLabelComponent],
  templateUrl: './config-preview.component.html',
  styleUrls: ['./config-preview.component.less'],
})
export class ConfigPreviewComponent implements OnInit {
  private readonly configService = inject(ConfigService);
  private readonly siteService = inject(SiteService);
  private readonly message = inject(NzMessageService);

  protected readonly sites = signal<SiteRecord[]>([]);
  protected readonly loading = signal(false);
  protected readonly rendering = signal(false);
  protected readonly result = signal<ConfigRenderResult | null>(null);
  protected readonly generatedAt = signal<number | null>(null);

  protected readonly selectedSite = computed(() => {
    const siteGuid = this.model.siteGuid;
    if (!siteGuid) return null;
    return this.sites().find((item) => item.guid === siteGuid) || null;
  });

  protected readonly enabledSites = computed(() =>
    this.sites().filter((item) => item.enabled !== false),
  );

  protected readonly previewStats = computed(() => {
    const config = this.result()?.config || '';
    return [
      {
        label: '配置行数',
        value: config ? `${config.split('\n').length}` : '-',
        icon: 'ordered-list',
      },
      {
        label: 'server 块',
        value: config ? `${this.matchCount(config, /^\s*server\s*\{/gm)}` : '-',
        icon: 'partition',
      },
      {
        label: 'upstream 块',
        value: config ? `${this.matchCount(config, /^\s*upstream\s+[^{]+\{/gm)}` : '-',
        icon: 'cluster',
      },
      {
        label: '配置大小',
        value: config ? this.formatBytes(new Blob([config]).size) : '-',
        icon: 'database',
      },
    ];
  });

  protected readonly model: ConfigRenderPayload = {
    siteGuid: '',
    save: false,
    reason: '生成配置预览',
  };

  ngOnInit(): void {
    this.loadSites();
  }

  protected refresh(): void {
    this.loadSites();
  }

  protected render(): void {
    this.rendering.set(true);
    this.configService
      .render(this.model)
      .pipe(finalize(() => this.rendering.set(false)))
      .subscribe({
        next: (result) => {
          this.result.set(result);
          this.generatedAt.set(Date.now());
          this.message.success(
            result.versionGuid ? `配置已生成并保存为 v${result.versionNo}` : '配置已生成',
          );
        },
        error: (err) => this.message.error(err?.msg || err?.message || '配置生成失败'),
      });
  }

  protected configText(): string {
    return this.result()?.config || '';
  }

  protected selectedSiteText(): string {
    if (!this.model.siteGuid) return '全部启用站点';
    const site = this.sites().find((item) => item.guid === this.model.siteGuid);
    return site ? `${site.name} / ${site.serverName}` : this.model.siteGuid;
  }

  protected selectedScopeHint(): string {
    const site = this.selectedSite();
    if (site) {
      return `${site.listen || '80'} · ${site.ssl ? 'HTTPS' : 'HTTP'} · ${site.enabled === false ? '未启用' : '已启用'}`;
    }
    return `${this.enabledSites().length} 个启用站点`;
  }

  protected lastGeneratedText(): string {
    const generatedAt = this.generatedAt();
    return generatedAt ? new Date(generatedAt).toLocaleString('zh-CN') : '尚未生成';
  }

  protected workflowItems(): Array<{
    label: string;
    icon: string;
    done: boolean;
    active: boolean;
  }> {
    const hasResult = Boolean(this.result()?.config);
    return [
      { label: '选择范围', icon: 'select', done: true, active: !hasResult },
      { label: '生成预览', icon: 'file-search', done: hasResult, active: !hasResult },
      { label: '检查配置', icon: 'code', done: false, active: hasResult },
      { label: '校验发布', icon: 'deployment-unit', done: false, active: false },
    ];
  }

  protected saveModeText(): string {
    if (this.result()?.versionGuid) return `已保存 v${this.result()?.versionNo || '-'}`;
    return this.model.save ? '生成后保存版本' : '仅预览不入库';
  }

  protected copyConfig(): void {
    const config = this.result()?.config;
    if (!config) return;
    navigator.clipboard
      .writeText(config)
      .then(() => this.message.success('配置已复制'))
      .catch(() => this.message.error('复制失败'));
  }

  private loadSites(): void {
    this.loading.set(true);
    this.siteService
      .list({ page: 1, size: 100, content: '' })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (result) => this.sites.set(result.data || []),
        error: (err) => this.message.error(err?.msg || err?.message || '站点列表加载失败'),
      });
  }

  private matchCount(value: string, pattern: RegExp): number {
    return value.match(pattern)?.length || 0;
  }

  private formatBytes(value: number): string {
    if (value < 1024) return `${value} B`;
    if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
    return `${(value / 1024 / 1024).toFixed(1)} MB`;
  }
}
