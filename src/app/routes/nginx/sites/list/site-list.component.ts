import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { STChange, STColumn, STPage } from '@delon/abc/st';
import { SHARED_IMPORTS, TitleLabelComponent } from '@shared';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzTagModule } from 'ng-zorro-antd/tag';

import { SiteRecord, SiteService } from '../site.service';

interface SummaryCardItem {
  label: string;
  value: string;
  hint: string;
  tone: 'plain' | 'success' | 'warning' | 'accent';
}

@Component({
  selector: 'nginx-site-list',
  imports: [SHARED_IMPORTS, TitleLabelComponent, NzTagModule],
  templateUrl: './site-list.component.html',
  styleUrls: ['./site-list.component.less'],
})
export class SiteListComponent implements OnInit {
  private readonly siteService = inject(SiteService);
  private readonly router = inject(Router);
  private readonly message = inject(NzMessageService);

  protected readonly rows = signal<SiteRecord[]>([]);
  protected readonly total = signal(0);
  protected readonly loading = signal(false);

  protected readonly query = {
    page: 1,
    size: 20,
    content: '',
  };

  protected readonly page: STPage = {
    front: false,
    showSize: true,
    showQuickJumper: true,
    pageSizes: [10, 20, 30, 50, 100],
    total: '共 {{total}} 条',
  };

  protected readonly columns: Array<STColumn<SiteRecord>> = [
    { title: '站点', render: 'siteTpl', width: 280 },
    { title: '域名 / 监听', render: 'serverTpl', width: 300 },
    { title: '目录 / 首页', render: 'rootTpl' },
    { title: 'HTTPS', render: 'sslTpl', width: 100 },
    { title: '启用', render: 'enabledTpl', width: 100 },
    { title: '操作', render: 'actionTpl', width: 210 },
  ];

  ngOnInit(): void {
    this.load();
  }

  protected refresh(): void {
    this.load();
  }

  protected load(): void {
    this.loading.set(true);
    this.siteService.list(this.query).subscribe({
      next: (result) => {
        this.rows.set(result.data || []);
        this.total.set(result.total || 0);
      },
      complete: () => this.loading.set(false),
      error: () => this.loading.set(false),
    });
  }

  protected search(): void {
    this.query.page = 1;
    this.load();
  }

  protected reset(): void {
    this.query.page = 1;
    this.query.content = '';
    this.load();
  }

  protected tableChange(event: STChange<SiteRecord>): void {
    if (event.type !== 'pi' && event.type !== 'ps') return;
    this.query.page = event.pi;
    this.query.size = event.ps;
    this.load();
  }

  protected create(): void {
    this.router.navigate(['/nginx/sites/create']);
  }

  protected edit(row: SiteRecord): void {
    const id = row.guid;
    if (!id) return;
    this.router.navigate(['/nginx/sites/edit', id]);
  }

  protected toggle(row: SiteRecord): void {
    const id = row.guid;
    if (!id) return;
    const enabled = row.enabled === false;
    this.siteService.toggle(id, enabled).subscribe({
      next: () => {
        this.message.success(enabled ? '站点已启用' : '站点已停用');
        this.load();
      },
    });
  }

  protected remove(row: SiteRecord): void {
    const id = row.guid;
    if (!id) return;
    this.siteService.delete(id).subscribe({
      next: () => {
        this.message.success('站点已删除');
        this.load();
      },
    });
  }

  protected summaryCards(): SummaryCardItem[] {
    const rows = this.rows();
    const enabled = rows.filter((row) => row.enabled !== false).length;
    const disabled = rows.filter((row) => row.enabled === false).length;
    const ssl = rows.filter((row) => row.ssl === true).length;
    return [
      {
        label: '站点总数',
        value: this.countText(this.total()),
        hint: '当前分页条件下的记录',
        tone: 'plain',
      },
      {
        label: '当前页启用',
        value: this.countText(enabled),
        hint: '参与配置生成',
        tone: 'success',
      },
      {
        label: '当前页停用',
        value: this.countText(disabled),
        hint: '不会渲染到发布配置',
        tone: 'warning',
      },
      {
        label: '当前页 HTTPS',
        value: this.countText(ssl),
        hint: '已开启 SSL 配置',
        tone: 'accent',
      },
    ];
  }

  private countText(value: number): string {
    return Number.isFinite(value) ? value.toLocaleString('zh-CN') : '0';
  }
}
