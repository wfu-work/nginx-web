import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { STChange, STColumn, STPage } from '@delon/abc/st';
import { SHARED_IMPORTS, TitleLabelComponent } from '@shared';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzTagModule } from 'ng-zorro-antd/tag';

import { CertificateRecord, CertificateService } from '../certificate.service';

interface SummaryCardItem {
  label: string;
  value: string;
  hint: string;
  tone: 'plain' | 'success' | 'warning' | 'accent';
}

@Component({
  selector: 'nginx-certificate-list',
  imports: [SHARED_IMPORTS, TitleLabelComponent, NzTagModule],
  templateUrl: './certificate-list.component.html',
  styleUrls: ['./certificate-list.component.less'],
})
export class CertificateListComponent implements OnInit {
  private readonly certificateService = inject(CertificateService);
  private readonly router = inject(Router);
  private readonly message = inject(NzMessageService);

  protected readonly rows = signal<CertificateRecord[]>([]);
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

  protected readonly columns: Array<STColumn<CertificateRecord>> = [
    { title: '证书', render: 'certTpl', width: 280 },
    { title: '域名 / 签发者', render: 'issuerTpl', width: 260 },
    { title: '路径', render: 'pathTpl' },
    { title: '有效期', render: 'validTpl', width: 210 },
    { title: '续期', render: 'renewTpl', width: 100 },
    { title: '操作', render: 'actionTpl', width: 150 },
  ];

  ngOnInit(): void {
    this.load();
  }

  protected refresh(): void {
    this.load();
  }

  protected load(): void {
    this.loading.set(true);
    this.certificateService.list(this.query).subscribe({
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

  protected tableChange(event: STChange<CertificateRecord>): void {
    if (event.type !== 'pi' && event.type !== 'ps') return;
    this.query.page = event.pi;
    this.query.size = event.ps;
    this.load();
  }

  protected create(): void {
    this.router.navigate(['/nginx/certificates/create']);
  }

  protected edit(row: CertificateRecord): void {
    const id = row.guid;
    if (!id) return;
    this.router.navigate(['/nginx/certificates/edit', id]);
  }

  protected remove(row: CertificateRecord): void {
    const id = row.guid;
    if (!id) return;
    this.certificateService.delete(id).subscribe({
      next: () => {
        this.message.success('证书已删除');
        this.load();
      },
    });
  }

  protected summaryCards(): SummaryCardItem[] {
    const rows = this.rows();
    const valid = rows.filter((row) => this.validityState(row) === 'valid').length;
    const expiring = rows.filter((row) => this.validityState(row) === 'expiring').length;
    const expired = rows.filter((row) => this.validityState(row) === 'expired').length;
    return [
      {
        label: '证书总数',
        value: this.countText(this.total()),
        hint: '当前分页条件下的记录',
        tone: 'plain',
      },
      {
        label: '当前页有效',
        value: this.countText(valid),
        hint: '距离过期超过 30 天',
        tone: 'success',
      },
      {
        label: '即将过期',
        value: this.countText(expiring),
        hint: '30 天内到期',
        tone: 'warning',
      },
      {
        label: '已过期',
        value: this.countText(expired),
        hint: '需要替换或续期',
        tone: 'accent',
      },
    ];
  }

  protected validityState(row: CertificateRecord): 'valid' | 'expiring' | 'expired' | 'unknown' {
    const notAfter = Number(row.notAfter || 0);
    if (!notAfter) return 'unknown';
    const now = Date.now();
    if (notAfter <= now) return 'expired';
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;
    return notAfter - now <= thirtyDays ? 'expiring' : 'valid';
  }

  protected validityText(row: CertificateRecord): string {
    const state = this.validityState(row);
    if (state === 'expired') return '已过期';
    if (state === 'expiring') return '即将过期';
    if (state === 'valid') return '有效';
    return '未知';
  }

  protected validityColor(row: CertificateRecord): string {
    const state = this.validityState(row);
    if (state === 'expired') return 'red';
    if (state === 'expiring') return 'gold';
    if (state === 'valid') return 'green';
    return 'default';
  }

  protected formatTime(value?: number): string {
    if (!value) return '-';
    return new Date(value).toLocaleString();
  }

  private countText(value: number): string {
    return Number.isFinite(value) ? value.toLocaleString('zh-CN') : '0';
  }
}
