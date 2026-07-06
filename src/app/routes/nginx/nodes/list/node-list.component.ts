import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { STChange, STColumn, STPage } from '@delon/abc/st';
import { SHARED_IMPORTS, TitleLabelComponent } from '@shared';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzTagModule } from 'ng-zorro-antd/tag';

import { NodeRecord, NodeService } from '../node.service';

interface SummaryCardItem {
  label: string;
  value: string;
  hint: string;
  tone: 'plain' | 'success' | 'warning' | 'accent';
}

@Component({
  selector: 'nginx-node-list',
  imports: [SHARED_IMPORTS, TitleLabelComponent, NzTagModule],
  templateUrl: './node-list.component.html',
  styleUrls: ['./node-list.component.less'],
})
export class NodeListComponent implements OnInit {
  private readonly nodeService = inject(NodeService);
  private readonly router = inject(Router);
  private readonly message = inject(NzMessageService);

  protected readonly rows = signal<NodeRecord[]>([]);
  protected readonly total = signal(0);
  protected readonly loading = signal(false);

  protected readonly query = {
    page: 1,
    size: 20,
    keyword: '',
    status: '',
    enabled: '',
    desc: 'create_time',
  };

  protected readonly page: STPage = {
    front: false,
    showSize: true,
    showQuickJumper: true,
    pageSizes: [10, 20, 30, 50, 100],
    total: '共 {{total}} 条',
  };

  protected readonly columns: Array<STColumn<NodeRecord>> = [
    { title: '节点', render: 'nodeTpl', width: 260 },
    { title: 'Agent', render: 'agentTpl', width: 220 },
    { title: '地址 / 标签', render: 'metaTpl' },
    { title: '状态', render: 'statusTpl', width: 110 },
    { title: '启用', render: 'enabledTpl', width: 90 },
    { title: '最后心跳', render: 'lastSeenTpl', width: 190 },
    {
      title: '操作',
      width: 180,
      buttons: [
        { text: '编辑', type: 'link', click: (record) => this.edit(record) },
        {
          text: '删除',
          type: 'del',
          pop: '确认删除这个 Agent 节点？相关任务会不可用。',
          className: 'text-error',
          click: (record) => this.remove(record),
        },
      ],
    },
  ];

  ngOnInit(): void {
    this.load();
  }

  protected refresh(): void {
    this.load();
  }

  protected load(): void {
    this.loading.set(true);
    this.nodeService.list(this.query).subscribe({
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
    this.query.keyword = '';
    this.query.status = '';
    this.query.enabled = '';
    this.query.desc = 'create_time';
    this.load();
  }

  protected tableChange(event: STChange<NodeRecord>): void {
    if (event.type !== 'pi' && event.type !== 'ps') return;
    this.query.page = event.pi;
    this.query.size = event.ps;
    this.load();
  }

  protected create(): void {
    this.router.navigate(['/nginx/nodes/create']);
  }

  protected edit(row: NodeRecord): void {
    const id = row.guid;
    if (!id) return;
    this.router.navigate(['/nginx/nodes/edit', id]);
  }

  protected remove(row: NodeRecord): void {
    const id = row.guid;
    if (!id) return;
    this.nodeService.delete(id).subscribe({
      next: () => {
        this.message.success('节点已删除');
        this.load();
      },
    });
  }

  protected summaryCards(): SummaryCardItem[] {
    const rows = this.rows();
    const online = rows.filter((row) => row.status === 'online').length;
    const offline = rows.filter((row) => row.status !== 'online').length;
    const disabled = rows.filter((row) => row.enabled === false).length;
    return [
      {
        label: '节点总数',
        value: this.countText(this.total()),
        hint: '当前筛选条件下的记录',
        tone: 'plain',
      },
      {
        label: '当前页在线',
        value: this.countText(online),
        hint: 'Agent 正常心跳',
        tone: 'success',
      },
      {
        label: '当前页离线',
        value: this.countText(offline),
        hint: '需要检查 Agent',
        tone: 'warning',
      },
      {
        label: '当前页停用',
        value: this.countText(disabled),
        hint: '不会参与任务转发',
        tone: 'accent',
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
