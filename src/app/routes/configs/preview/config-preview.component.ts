import { Component, OnInit, inject, signal } from '@angular/core';
import { SHARED_IMPORTS, TitleLabelComponent } from '@shared';
import { NzMessageService } from 'ng-zorro-antd/message';

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
    this.configService.render(this.model).subscribe({
      next: (result) => {
        this.result.set(result);
        this.message.success(
          result.versionGuid ? `配置已生成并保存为 v${result.versionNo}` : '配置已生成',
        );
      },
      complete: () => this.rendering.set(false),
      error: () => this.rendering.set(false),
    });
  }

  protected configText(): string {
    return this.result()?.config || '点击“生成预览”后查看最终 Nginx 配置。';
  }

  protected selectedSiteText(): string {
    if (!this.model.siteGuid) return '全部启用站点';
    const site = this.sites().find((item) => item.guid === this.model.siteGuid);
    return site ? `${site.name} / ${site.serverName}` : this.model.siteGuid;
  }

  private loadSites(): void {
    this.loading.set(true);
    this.siteService.list({ page: 1, size: 100, content: '' }).subscribe({
      next: (result) => this.sites.set(result.data || []),
      complete: () => this.loading.set(false),
      error: () => this.loading.set(false),
    });
  }
}
