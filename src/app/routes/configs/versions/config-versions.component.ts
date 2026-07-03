import { Component, OnInit, inject, signal } from '@angular/core';
import { STChange, STColumn, STPage } from '@delon/abc/st';
import { SHARED_IMPORTS, TitleLabelComponent } from '@shared';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzTagModule } from 'ng-zorro-antd/tag';

import { NodeRecord, NodeService } from '../../nginx/nodes/node.service';
import { ConfigDiffResult, ConfigService, ConfigVersion, PublishResult } from '../config.service';

interface SummaryCardItem {
  label: string;
  value: string;
  hint: string;
  tone: 'plain' | 'success' | 'warning' | 'accent';
}

@Component({
  selector: 'nginx-config-versions',
  imports: [SHARED_IMPORTS, TitleLabelComponent, NzTagModule],
  templateUrl: './config-versions.component.html',
  styleUrls: ['./config-versions.component.less'],
})
export class ConfigVersionsComponent implements OnInit {
  private readonly configService = inject(ConfigService);
  private readonly nodeService = inject(NodeService);
  private readonly message = inject(NzMessageService);

  protected readonly rows = signal<ConfigVersion[]>([]);
  protected readonly nodes = signal<NodeRecord[]>([]);
  protected readonly total = signal(0);
  protected readonly loading = signal(false);
  protected readonly selectedVersion = signal<ConfigVersion | null>(null);
  protected readonly diffResult = signal<ConfigDiffResult | null>(null);
  protected readonly rollbackResult = signal<PublishResult | null>(null);

  protected rollbackNodeGuid = '';
  protected readonly diffModel = {
    fromVersionGuid: '',
    toVersionGuid: '',
    fromConfig: '',
    toConfig: '',
  };

  protected readonly query = {
    page: 1,
    size: 20,
    content: '',
    desc: 'create_time',
  };

  protected readonly page: STPage = {
    front: false,
    showSize: true,
    showQuickJumper: true,
    pageSizes: [10, 20, 30, 50, 100],
    total: '共 {{total}} 条',
  };

  protected readonly columns: Array<STColumn<ConfigVersion>> = [
    { title: '版本', render: 'versionTpl', width: 190 },
    { title: '状态', render: 'statusTpl', width: 120 },
    { title: '校验', render: 'validateTpl', width: 120 },
    { title: '原因', render: 'reasonTpl' },
    { title: '时间', render: 'publishedTpl', width: 190 },
    { title: '操作', render: 'actionTpl', width: 300 },
  ];

  ngOnInit(): void {
    this.loadNodes();
    this.load();
  }

  protected refresh(): void {
    this.load();
  }

  protected load(): void {
    this.loading.set(true);
    this.configService.versions(this.query).subscribe({
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
    this.query.desc = 'create_time';
    this.load();
  }

  protected tableChange(event: STChange<ConfigVersion>): void {
    if (event.type !== 'pi' && event.type !== 'ps') return;
    this.query.page = event.pi;
    this.query.size = event.ps;
    this.load();
  }

  protected view(row: ConfigVersion): void {
    if (!row.guid) return;
    this.configService.version(row.guid).subscribe({
      next: (version) => this.selectedVersion.set(version),
    });
  }

  protected useForDiff(row: ConfigVersion, side: 'from' | 'to'): void {
    if (!row.guid) return;
    if (side === 'from') this.diffModel.fromVersionGuid = row.guid;
    else this.diffModel.toVersionGuid = row.guid;
    this.message.success(side === 'from' ? '已设为旧版' : '已设为新版');
  }

  protected diff(): void {
    if (
      !this.diffModel.fromVersionGuid &&
      !this.diffModel.toVersionGuid &&
      !this.diffModel.fromConfig &&
      !this.diffModel.toConfig
    ) {
      this.message.warning('请选择要对比的版本');
      return;
    }
    this.configService.diff(this.diffModel).subscribe({
      next: (result) => {
        this.diffResult.set(result);
        this.message.success('Diff 已生成');
      },
    });
  }

  protected rollback(row: ConfigVersion): void {
    if (!row.guid) return;
    if (!this.rollbackNodeGuid) {
      this.message.warning('请先选择回滚目标节点');
      return;
    }
    this.configService
      .rollback({
        nodeGuid: this.rollbackNodeGuid,
        versionGuid: row.guid,
        confirm: true,
        reason: `回滚到 v${row.versionNo || '-'}`,
      })
      .subscribe({
        next: (result) => {
          this.rollbackResult.set(result);
          if (result.success) this.message.success(result.message || '已发起回滚');
          else this.message.warning(result.message || '回滚失败');
          this.load();
        },
      });
  }

  protected summaryCards(): SummaryCardItem[] {
    const rows = this.rows();
    const published = rows.filter((row) => row.status === 'published').length;
    const validated = rows.filter((row) => row.status === 'validated').length;
    const rolledBack = rows.filter((row) => row.status === 'rolled_back').length;
    return [
      {
        label: '版本总数',
        value: this.countText(this.total()),
        hint: '当前筛选条件下的记录',
        tone: 'plain',
      },
      {
        label: '当前页已发布',
        value: this.countText(published),
        hint: '已写入节点并 reload',
        tone: 'success',
      },
      {
        label: '当前页已校验',
        value: this.countText(validated),
        hint: '可作为发布候选',
        tone: 'accent',
      },
      {
        label: '当前页回滚',
        value: this.countText(rolledBack),
        hint: '由历史版本恢复',
        tone: 'warning',
      },
    ];
  }

  protected nodeLabel(node: NodeRecord): string {
    const name = node.name || node.agentId || node.guid || '-';
    const status = node.status === 'online' ? '在线' : '离线';
    return `${name} / ${node.agentId || 'Agent'} / ${status}`;
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

  protected statusColor(status?: string): string {
    const map: Record<string, string> = {
      rendered: 'default',
      validated: 'blue',
      published: 'green',
      rolled_back: 'orange',
    };
    return status ? map[status] || 'default' : 'default';
  }

  protected validateColor(row: ConfigVersion): string {
    if (row.validateOk === true) return 'green';
    if (row.validateOk === false && row.validateMsg) return 'red';
    return 'default';
  }

  protected validateText(row: ConfigVersion): string {
    if (row.validateOk === true) return '通过';
    if (row.validateOk === false && row.validateMsg) return '失败';
    return '未校验';
  }

  protected formatTime(value?: number): string {
    if (!value) return '-';
    return new Date(value).toLocaleString();
  }

  protected selectedConfigText(): string {
    return this.selectedVersion()?.config || '点击版本行的“查看”后预览配置内容。';
  }

  protected diffText(): string {
    return this.diffResult()?.diffText || '选择旧版和新版后生成 Diff。';
  }

  protected asText(value: unknown): string {
    if (value === undefined || value === null || value === '') return '-';
    if (typeof value === 'object') return JSON.stringify(value, null, 2);
    return String(value);
  }

  private loadNodes(): void {
    this.nodeService
      .list({ page: 1, size: 100, keyword: '', status: '', enabled: 'true', desc: 'createTime' })
      .subscribe({
        next: (result) => {
          const nodes = result.data || [];
          this.nodes.set(nodes);
          if (!this.rollbackNodeGuid && nodes.length) {
            const node = nodes.find((item) => item.status === 'online') || nodes[0];
            this.rollbackNodeGuid = node.guid || '';
          }
        },
      });
  }

  private countText(value: number): string {
    return Number.isFinite(value) ? value.toLocaleString('zh-CN') : '0';
  }
}
