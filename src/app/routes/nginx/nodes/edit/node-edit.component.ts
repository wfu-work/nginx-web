import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SHARED_IMPORTS, TitleLabelComponent } from '@shared';
import { NzMessageService } from 'ng-zorro-antd/message';
import { finalize } from 'rxjs';

import { NodeRecord, NodeService } from '../node.service';

type NodeForm = NodeRecord & {
  name: string;
  accessMode: 'agent';
  agentId: string;
  address: string;
  labels: string;
  status: 'online' | 'offline';
  version: string;
  enabled: boolean;
  description: string;
};

@Component({
  selector: 'nginx-node-edit',
  imports: [SHARED_IMPORTS, TitleLabelComponent],
  templateUrl: './node-edit.component.html',
  styleUrls: ['./node-edit.component.less'],
})
export class NodeEditComponent implements OnInit {
  private readonly nodeService = inject(NodeService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly message = inject(NzMessageService);

  protected readonly saving = signal(false);
  protected readonly loading = signal(false);
  protected readonly isEdit = signal(false);
  protected model: NodeForm = this.defaults();

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    this.isEdit.set(!!id);
    if (!id) return;
    this.loading.set(true);
    this.nodeService
      .detail(id)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe((data) => {
        this.model = {
          ...this.defaults(),
          ...data,
          accessMode: 'agent',
          status: data.status === 'online' ? 'online' : 'offline',
          enabled: data.enabled !== false,
        };
      });
  }

  protected save(): void {
    if (this.saving() || this.loading()) return;
    const body = this.normalizeNode();
    const validationError = this.validateNode(body);
    if (validationError) {
      this.message.warning(validationError);
      return;
    }

    this.saving.set(true);
    const request = this.isEdit() ? this.nodeService.update(body) : this.nodeService.create(body);
    request.pipe(finalize(() => this.saving.set(false))).subscribe({
      next: () => {
        this.message.success(this.isEdit() ? '节点已更新' : '节点已创建');
        this.router.navigate(['/nginx/nodes']);
      },
    });
  }

  protected cancel(): void {
    this.router.navigate(['/nginx/nodes']);
  }

  protected canSubmit(): boolean {
    return !this.saving() && !this.loading() && this.trimField('name').length > 0;
  }

  private normalizeNode(): NodeRecord {
    return {
      ...this.model,
      name: this.trimField('name'),
      accessMode: 'agent',
      agentId: this.trimField('agentId'),
      address: this.trimField('address'),
      labels: this.normalizeLabels(this.model.labels),
      status: this.model.status || 'offline',
      version: this.trimField('version'),
      enabled: this.model.enabled !== false,
      description: this.trimField('description'),
    };
  }

  private validateNode(body: NodeRecord): string {
    if (!body.name) return '请填写节点名称';
    return '';
  }

  private trimField(key: keyof NodeForm): string {
    return String(this.model[key] || '').trim();
  }

  private normalizeLabels(value: unknown): string {
    return String(value || '')
      .split(/[\n,]/)
      .map((item) => item.trim())
      .filter(Boolean)
      .join(',');
  }

  private defaults(): NodeForm {
    return {
      name: '',
      accessMode: 'agent',
      agentId: '',
      address: '',
      labels: '',
      status: 'offline',
      version: '',
      enabled: true,
      description: '',
    };
  }
}
