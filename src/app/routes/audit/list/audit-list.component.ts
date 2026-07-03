import { Component, OnInit, inject, signal } from '@angular/core';
import { STChange, STColumn, STPage } from '@delon/abc/st';
import { SHARED_IMPORTS, TitleLabelComponent } from '@shared';
import { NzTagModule } from 'ng-zorro-antd/tag';

import { AuditListQuery, AuditRecord, AuditService } from '../audit.service';

interface SummaryCardItem {
  label: string;
  value: string;
  hint: string;
  tone: 'plain' | 'success' | 'warning' | 'accent';
}

@Component({
  selector: 'app-audit-list',
  imports: [SHARED_IMPORTS, TitleLabelComponent, NzTagModule],
  templateUrl: './audit-list.component.html',
  styleUrls: ['./audit-list.component.less'],
})
export class AuditListComponent implements OnInit {
  private readonly auditService = inject(AuditService);

  protected readonly rows = signal<AuditRecord[]>([]);
  protected readonly total = signal(0);
  protected readonly loading = signal(false);
  protected readonly selected = signal<AuditRecord | null>(null);

  protected readonly query: AuditListQuery = {
    page: 1,
    size: 20,
    content: '',
    action: '',
    status: '',
    desc: 'create_time',
  };

  protected readonly page: STPage = {
    front: false,
    showSize: true,
    showQuickJumper: true,
    pageSizes: [10, 20, 30, 50, 100],
    total: '共 {{total}} 条',
  };

  protected readonly columns: Array<STColumn<AuditRecord>> = [
    { title: '动作', render: 'actionTpl', width: 220 },
    { title: '资源', render: 'resourceTpl', width: 260 },
    { title: '状态', render: 'statusTpl', width: 110 },
    { title: '说明', render: 'messageTpl' },
    { title: '原因', render: 'reasonTpl', width: 220 },
    { title: '时间', render: 'timeTpl', width: 190 },
    { title: '操作', render: 'actionBarTpl', width: 90 },
  ];

  ngOnInit(): void {
    this.load();
  }

  protected refresh(): void {
    this.load();
  }

  protected load(): void {
    this.loading.set(true);
    this.auditService.list(this.query).subscribe({
      next: (result) => {
        const rows = result.data || [];
        this.rows.set(rows);
        this.total.set(result.total || 0);
        if (!this.selected() && rows.length) this.selected.set(rows[0]);
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
    this.query.action = '';
    this.query.status = '';
    this.query.desc = 'create_time';
    this.selected.set(null);
    this.load();
  }

  protected tableChange(event: STChange<AuditRecord>): void {
    if (event.type !== 'pi' && event.type !== 'ps') return;
    this.query.page = event.pi;
    this.query.size = event.ps;
    this.load();
  }

  protected view(row: AuditRecord): void {
    this.selected.set(row);
  }

  protected summaryCards(): SummaryCardItem[] {
    const rows = this.rows();
    const success = rows.filter((row) => row.success === true || row.status === 'success').length;
    const failed = rows.filter((row) => row.success === false || row.status === 'failed').length;
    const publish = rows.filter(
      (row) => row.action === 'config_publish' || row.action === 'config_rollback',
    ).length;
    return [
      {
        label: '审计总数',
        value: this.countText(this.total()),
        hint: '当前筛选条件下的记录',
        tone: 'plain',
      },
      {
        label: '当前页成功',
        value: this.countText(success),
        hint: '动作执行成功',
        tone: 'success',
      },
      {
        label: '当前页失败',
        value: this.countText(failed),
        hint: '需要检查错误信息',
        tone: 'warning',
      },
      {
        label: '配置变更',
        value: this.countText(publish),
        hint: '发布或回滚记录',
        tone: 'accent',
      },
    ];
  }

  protected actionText(action?: string): string {
    const map: Record<string, string> = {
      nginx_operation: 'Nginx 操作',
      config_publish: '配置发布',
      config_rollback: '配置回滚',
    };
    return action ? map[action] || action : '-';
  }

  protected actionColor(action?: string): string {
    const map: Record<string, string> = {
      nginx_operation: 'blue',
      config_publish: 'green',
      config_rollback: 'orange',
    };
    return action ? map[action] || 'default' : 'default';
  }

  protected statusText(row: AuditRecord): string {
    if (row.status)
      return row.status === 'success' ? '成功' : row.status === 'failed' ? '失败' : row.status;
    if (row.success === true) return '成功';
    if (row.success === false) return '失败';
    return '-';
  }

  protected statusColor(row: AuditRecord): string {
    if (row.success === true || row.status === 'success') return 'green';
    if (row.success === false || row.status === 'failed') return 'red';
    return 'default';
  }

  protected formatTime(value?: number): string {
    if (!value) return '-';
    return new Date(value).toLocaleString();
  }

  protected detailText(row: AuditRecord | null): string {
    if (!row) return '点击记录行的“详情”查看审计明细。';
    const detail = this.parseDetail(row.detail);
    const payload = {
      guid: row.guid,
      action: row.action,
      resourceType: row.resourceType,
      resourceGuid: row.resourceGuid,
      status: row.status,
      success: row.success,
      message: row.message,
      reason: row.reason,
      detail,
    };
    return JSON.stringify(payload, null, 2);
  }

  private parseDetail(value?: string): unknown {
    if (!value) return {};
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }

  private countText(value: number): string {
    return Number.isFinite(value) ? value.toLocaleString('zh-CN') : '0';
  }
}
