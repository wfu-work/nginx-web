import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { STChange, STColumn, STPage } from '@delon/abc/st';
import { SHARED_IMPORTS, TitleLabelComponent } from '@shared';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { finalize } from 'rxjs';

import { UpstreamHealthResult, UpstreamRecord, UpstreamService } from '../upstream.service';

interface SummaryCardItem {
  label: string;
  value: string;
  hint: string;
  tone: 'plain' | 'success' | 'warning' | 'accent';
}

@Component({
  selector: 'nginx-upstream-list',
  imports: [SHARED_IMPORTS, TitleLabelComponent, NzTagModule],
  templateUrl: './upstream-list.component.html',
  styleUrls: ['./upstream-list.component.less'],
})
export class UpstreamListComponent implements OnInit {
  private readonly upstreamService = inject(UpstreamService);
  private readonly router = inject(Router);
  private readonly message = inject(NzMessageService);

  protected readonly rows = signal<UpstreamRecord[]>([]);
  protected readonly total = signal(0);
  protected readonly loading = signal(false);
  protected readonly healthLoading = signal(false);
  protected readonly healthResult = signal<UpstreamHealthResult | null>(null);

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

  protected readonly columns: Array<STColumn<UpstreamRecord>> = [
    { title: '上游组', render: 'upstreamTpl', width: 280 },
    { title: '负载策略', render: 'methodTpl', width: 180 },
    { title: '扩展配置', render: 'extraTpl' },
    { title: '操作', render: 'actionTpl', width: 230 },
  ];

  ngOnInit(): void {
    this.load();
  }

  protected refresh(): void {
    this.load();
  }

  protected load(): void {
    this.loading.set(true);
    this.upstreamService.list(this.query).subscribe({
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

  protected tableChange(event: STChange<UpstreamRecord>): void {
    if (event.type !== 'pi' && event.type !== 'ps') return;
    this.query.page = event.pi;
    this.query.size = event.ps;
    this.load();
  }

  protected create(): void {
    this.router.navigate(['/nginx/upstreams/create']);
  }

  protected edit(row: UpstreamRecord): void {
    const id = row.guid;
    if (!id) return;
    this.router.navigate(['/nginx/upstreams/edit', id]);
  }

  protected checkHealth(row: UpstreamRecord): void {
    const id = row.guid;
    if (!id) return;
    this.healthLoading.set(true);
    this.upstreamService
      .health(id)
      .pipe(finalize(() => this.healthLoading.set(false)))
      .subscribe({
        next: (result) => {
          this.healthResult.set(result);
          if (result.healthy) this.message.success('上游健康检查通过');
          else this.message.warning('上游存在不可用节点');
        },
      });
  }

  protected remove(row: UpstreamRecord): void {
    const id = row.guid;
    if (!id) return;
    this.upstreamService.delete(id).subscribe({
      next: () => {
        this.message.success('上游已删除');
        this.load();
      },
    });
  }

  protected summaryCards(): SummaryCardItem[] {
    const rows = this.rows();
    const defaultMethod = rows.filter((row) => !row.method).length;
    const weighted = rows.filter((row) => row.method === 'least_conn' || row.method === 'ip_hash').length;
    const custom = rows.filter((row) => row.extraConfig).length;
    return [
      {
        label: '上游总数',
        value: this.countText(this.total()),
        hint: '当前分页条件下的记录',
        tone: 'plain',
      },
      {
        label: '默认轮询',
        value: this.countText(defaultMethod),
        hint: '当前页未指定策略',
        tone: 'success',
      },
      {
        label: '策略路由',
        value: this.countText(weighted),
        hint: 'least_conn 或 ip_hash',
        tone: 'accent',
      },
      {
        label: '扩展配置',
        value: this.countText(custom),
        hint: '包含自定义 upstream 指令',
        tone: 'warning',
      },
    ];
  }

  protected formatTime(value?: number): string {
    if (!value) return '-';
    return new Date(value).toLocaleString();
  }

  private countText(value: number): string {
    return Number.isFinite(value) ? value.toLocaleString('zh-CN') : '0';
  }
}
