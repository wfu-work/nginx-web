import { Component, OnInit, inject, signal } from '@angular/core';
import { STChange, STColumn, STPage } from '@delon/abc/st';
import { SHARED_IMPORTS, TitleLabelComponent } from '@shared';
import { NzTagModule } from 'ng-zorro-antd/tag';

import { ConfigService, PublishTask } from '../config.service';

interface SummaryCardItem {
  label: string;
  value: string;
  hint: string;
  tone: 'plain' | 'success' | 'warning' | 'accent';
}

@Component({
  selector: 'nginx-config-tasks',
  imports: [SHARED_IMPORTS, TitleLabelComponent, NzTagModule],
  templateUrl: './config-tasks.component.html',
  styleUrls: ['./config-tasks.component.less'],
})
export class ConfigTasksComponent implements OnInit {
  private readonly configService = inject(ConfigService);

  protected readonly rows = signal<PublishTask[]>([]);
  protected readonly total = signal(0);
  protected readonly loading = signal(false);

  protected readonly query = {
    page: 1,
    size: 20,
    content: '',
    desc: 'createTime',
  };

  protected readonly page: STPage = {
    front: false,
    showSize: true,
    showQuickJumper: true,
    pageSizes: [10, 20, 30, 50, 100],
    total: '共 {{total}} 条',
  };

  protected readonly columns: Array<STColumn<PublishTask>> = [
    { title: '任务', render: 'taskTpl', width: 210 },
    { title: '状态', render: 'statusTpl', width: 120 },
    { title: '版本', render: 'versionTpl', width: 190 },
    { title: '目标路径', render: 'targetTpl' },
    { title: '耗时', render: 'durationTpl', width: 120 },
    { title: '说明', render: 'messageTpl', width: 280 },
  ];

  ngOnInit(): void {
    this.load();
  }

  protected refresh(): void {
    this.load();
  }

  protected load(): void {
    this.loading.set(true);
    this.configService.tasks(this.query).subscribe({
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
    this.query.desc = 'createTime';
    this.load();
  }

  protected tableChange(event: STChange<PublishTask>): void {
    if (event.type !== 'pi' && event.type !== 'ps') return;
    this.query.page = event.pi;
    this.query.size = event.ps;
    this.load();
  }

  protected summaryCards(): SummaryCardItem[] {
    const rows = this.rows();
    const success = rows.filter((row) => row.success === true).length;
    const failed = rows.filter((row) => row.success === false).length;
    const rollback = rows.filter((row) => row.action === 'rollback').length;
    return [
      {
        label: '任务总数',
        value: this.countText(this.total()),
        hint: '当前筛选条件下的记录',
        tone: 'plain',
      },
      {
        label: '当前页成功',
        value: this.countText(success),
        hint: '已完成发布或回滚',
        tone: 'success',
      },
      {
        label: '当前页失败',
        value: this.countText(failed),
        hint: '需要检查节点或配置',
        tone: 'warning',
      },
      {
        label: '当前页回滚',
        value: this.countText(rollback),
        hint: '回滚动作记录',
        tone: 'accent',
      },
    ];
  }

  protected actionText(action?: string): string {
    const map: Record<string, string> = {
      publish: '发布',
      rollback: '回滚',
    };
    return action ? map[action] || action : '-';
  }

  protected statusText(row: PublishTask): string {
    return row.status || (row.success ? 'success' : 'failed');
  }

  protected statusColor(row: PublishTask): string {
    if (row.success === true) return 'green';
    if (row.success === false) return 'red';
    return 'default';
  }

  protected durationText(value?: number): string {
    if (!value) return '0ms';
    if (value >= 1000) return `${(value / 1000).toFixed(2)}s`;
    return `${value}ms`;
  }

  private countText(value: number): string {
    return Number.isFinite(value) ? value.toLocaleString('zh-CN') : '0';
  }
}
