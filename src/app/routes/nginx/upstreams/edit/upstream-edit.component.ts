import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { STColumn, STPage } from '@delon/abc/st';
import { SHARED_IMPORTS, TitleLabelComponent } from '@shared';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { finalize } from 'rxjs';

import {
  UpstreamHealthResult,
  UpstreamRecord,
  UpstreamServer,
  UpstreamService,
} from '../upstream.service';

type UpstreamForm = UpstreamRecord & {
  name: string;
  method: string;
  extraConfig: string;
};

type ServerForm = UpstreamServer & {
  upstreamGuid: string;
  address: string;
  weight: number | null;
  maxFails: number | null;
  failTimeout: string;
  backup: boolean;
  down: boolean;
  sort: number | null;
};

@Component({
  selector: 'nginx-upstream-edit',
  imports: [SHARED_IMPORTS, TitleLabelComponent, NzTagModule],
  templateUrl: './upstream-edit.component.html',
  styleUrls: ['./upstream-edit.component.less'],
})
export class UpstreamEditComponent implements OnInit {
  private readonly upstreamService = inject(UpstreamService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly message = inject(NzMessageService);

  protected readonly saving = signal(false);
  protected readonly loading = signal(false);
  protected readonly serverSaving = signal(false);
  protected readonly healthLoading = signal(false);
  protected readonly isEdit = signal(false);
  protected readonly servers = signal<UpstreamServer[]>([]);
  protected readonly healthResult = signal<UpstreamHealthResult | null>(null);

  protected model: UpstreamForm = this.upstreamDefaults();
  protected serverModel: ServerForm = this.serverDefaults();

  protected readonly serverPage: STPage = {
    front: true,
    show: false,
  };

  protected readonly serverColumns: Array<STColumn<UpstreamServer>> = [
    { title: '地址', render: 'addressTpl' },
    { title: '权重', render: 'weightTpl', width: 90 },
    { title: '失败策略', render: 'failTpl', width: 170 },
    { title: '状态', render: 'stateTpl', width: 150 },
    { title: '排序', render: 'sortTpl', width: 90 },
    { title: '操作', render: 'serverActionTpl', width: 140 },
  ];

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    this.isEdit.set(!!id);
    if (!id) return;
    this.loadUpstream(id);
  }

  protected save(): void {
    if (this.saving() || this.loading()) return;
    const body = this.normalizeUpstream();
    const validationError = this.validateUpstream(body);
    if (validationError) {
      this.message.warning(validationError);
      return;
    }

    this.saving.set(true);
    const request = this.isEdit() ? this.upstreamService.update(body) : this.upstreamService.create(body);
    request.pipe(finalize(() => this.saving.set(false))).subscribe({
      next: () => {
        this.message.success(this.isEdit() ? '上游已更新' : '上游已创建');
        if (!this.isEdit()) {
          this.router.navigate(['/nginx/upstreams']);
        }
      },
    });
  }

  protected cancel(): void {
    this.router.navigate(['/nginx/upstreams']);
  }

  protected canSubmit(): boolean {
    return !this.saving() && !this.loading() && this.trimUpstream('name').length > 0;
  }

  protected canSaveServer(): boolean {
    return this.isEdit() && !this.serverSaving() && this.currentUpstreamGuid().length > 0 && this.trimServer('address').length > 0;
  }

  protected saveServer(): void {
    if (!this.canSaveServer()) {
      this.message.warning(this.isEdit() ? '请填写上游节点地址' : '请先保存上游组后再维护节点');
      return;
    }

    const upstreamGuid = this.currentUpstreamGuid();
    const body = this.normalizeServer(upstreamGuid);
    this.serverSaving.set(true);
    const request = body.guid
      ? this.upstreamService.updateServer(upstreamGuid, body)
      : this.upstreamService.createServer(upstreamGuid, body);
    request.pipe(finalize(() => this.serverSaving.set(false))).subscribe({
      next: () => {
        this.message.success(body.guid ? '上游节点已更新' : '上游节点已添加');
        this.resetServer();
        this.loadUpstream(upstreamGuid, false);
        this.checkHealth(false);
      },
    });
  }

  protected editServer(row: UpstreamServer): void {
    this.serverModel = {
      ...this.serverDefaults(),
      ...row,
      upstreamGuid: row.upstreamGuid || this.currentUpstreamGuid(),
      weight: row.weight ?? 1,
      maxFails: row.maxFails ?? 3,
      failTimeout: row.failTimeout || '30s',
      backup: row.backup === true,
      down: row.down === true,
      sort: row.sort ?? 0,
    };
  }

  protected removeServer(row: UpstreamServer): void {
    const upstreamGuid = row.upstreamGuid || this.currentUpstreamGuid();
    const serverGuid = row.guid;
    if (!upstreamGuid || !serverGuid) return;

    this.upstreamService.deleteServer(upstreamGuid, serverGuid).subscribe({
      next: () => {
        this.message.success('上游节点已删除');
        this.loadUpstream(upstreamGuid, false);
      },
    });
  }

  protected resetServer(): void {
    this.serverModel = this.serverDefaults(this.currentUpstreamGuid());
  }

  protected checkHealth(showMessage = true): void {
    const upstreamGuid = this.currentUpstreamGuid();
    if (!upstreamGuid) return;

    this.healthLoading.set(true);
    this.upstreamService
      .health(upstreamGuid)
      .pipe(finalize(() => this.healthLoading.set(false)))
      .subscribe({
        next: (result) => {
          this.healthResult.set(result);
          if (!showMessage) return;
          if (result.healthy) this.message.success('健康检查通过');
          else this.message.warning('上游存在不可用节点');
        },
      });
  }

  protected currentUpstreamGuid(): string {
    return this.model.guid || this.route.snapshot.paramMap.get('id') || '';
  }

  protected formatTime(value?: number): string {
    if (!value) return '-';
    return new Date(value).toLocaleString();
  }

  private loadUpstream(id: string, showLoading = true): void {
    if (showLoading) this.loading.set(true);
    this.upstreamService
      .detail(id)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe((detail) => {
        this.model = {
          ...this.upstreamDefaults(),
          ...detail.upstream,
        };
        this.servers.set(detail.servers || []);
        this.resetServer();
      });
  }

  private normalizeUpstream(): UpstreamRecord {
    return {
      ...this.model,
      name: this.trimUpstream('name'),
      method: this.trimUpstream('method'),
      extraConfig: this.trimUpstream('extraConfig'),
    };
  }

  private validateUpstream(body: UpstreamRecord): string {
    if (!body.name) return '请填写上游名称';
    return '';
  }

  private normalizeServer(upstreamGuid: string): UpstreamServer {
    return {
      ...this.serverModel,
      upstreamGuid,
      address: this.trimServer('address'),
      weight: Number(this.serverModel.weight || 1),
      maxFails: Number(this.serverModel.maxFails || 3),
      failTimeout: this.trimServer('failTimeout') || '30s',
      backup: this.serverModel.backup === true,
      down: this.serverModel.down === true,
      sort: Number(this.serverModel.sort || 0),
    };
  }

  private trimUpstream(key: keyof UpstreamForm): string {
    return String(this.model[key] || '').trim();
  }

  private trimServer(key: keyof ServerForm): string {
    return String(this.serverModel[key] || '').trim();
  }

  private upstreamDefaults(): UpstreamForm {
    return {
      name: '',
      method: '',
      extraConfig: '',
    };
  }

  private serverDefaults(upstreamGuid = ''): ServerForm {
    return {
      upstreamGuid,
      address: '127.0.0.1:8080',
      weight: 1,
      maxFails: 3,
      failTimeout: '30s',
      backup: false,
      down: false,
      sort: 0,
    };
  }
}
