import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SHARED_IMPORTS, TitleLabelComponent } from '@shared';
import { NzMessageService } from 'ng-zorro-antd/message';
import { finalize } from 'rxjs';

import { CertificateRecord, CertificateService } from '../certificate.service';

type CertificateForm = CertificateRecord & {
  name: string;
  serverName: string;
  certPath: string;
  keyPath: string;
  issuer: string;
  notBefore: number | null;
  notAfter: number | null;
  autoRenew: boolean;
  description: string;
};

@Component({
  selector: 'nginx-certificate-edit',
  imports: [SHARED_IMPORTS, TitleLabelComponent],
  templateUrl: './certificate-edit.component.html',
  styleUrls: ['./certificate-edit.component.less'],
})
export class CertificateEditComponent implements OnInit {
  private readonly certificateService = inject(CertificateService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly message = inject(NzMessageService);

  protected readonly saving = signal(false);
  protected readonly loading = signal(false);
  protected readonly isEdit = signal(false);
  protected model: CertificateForm = this.defaults();

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    this.isEdit.set(!!id);
    if (!id) return;
    this.loading.set(true);
    this.certificateService
      .detail(id)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe((data) => {
        this.model = {
          ...this.defaults(),
          ...data,
          notBefore: data.notBefore || 0,
          notAfter: data.notAfter || 0,
          autoRenew: data.autoRenew === true,
        };
      });
  }

  protected save(): void {
    if (this.saving() || this.loading()) return;
    const body = this.normalizeCertificate();
    const validationError = this.validateCertificate(body);
    if (validationError) {
      this.message.warning(validationError);
      return;
    }

    this.saving.set(true);
    const request = this.isEdit() ? this.certificateService.update(body) : this.certificateService.create(body);
    request.pipe(finalize(() => this.saving.set(false))).subscribe({
      next: () => {
        this.message.success(this.isEdit() ? '证书已更新' : '证书已创建');
        this.router.navigate(['/nginx/certificates']);
      },
    });
  }

  protected cancel(): void {
    this.router.navigate(['/nginx/certificates']);
  }

  protected canSubmit(): boolean {
    return (
      !this.saving() &&
      !this.loading() &&
      this.trimField('name').length > 0 &&
      this.trimField('certPath').length > 0 &&
      this.trimField('keyPath').length > 0
    );
  }

  protected formatTime(value?: number | null): string {
    if (!value) return '未设置';
    return new Date(value).toLocaleString();
  }

  private normalizeCertificate(): CertificateRecord {
    return {
      ...this.model,
      name: this.trimField('name'),
      serverName: this.trimField('serverName'),
      certPath: this.trimField('certPath'),
      keyPath: this.trimField('keyPath'),
      issuer: this.trimField('issuer'),
      notBefore: Number(this.model.notBefore || 0),
      notAfter: Number(this.model.notAfter || 0),
      autoRenew: this.model.autoRenew === true,
      description: this.trimField('description'),
    };
  }

  private validateCertificate(body: CertificateRecord): string {
    if (!body.name) return '请填写证书名称';
    if (!body.certPath) return '请填写证书路径';
    if (!body.keyPath) return '请填写私钥路径';
    return '';
  }

  private trimField(key: keyof CertificateForm): string {
    return String(this.model[key] || '').trim();
  }

  private defaults(): CertificateForm {
    return {
      name: '',
      serverName: '',
      certPath: '',
      keyPath: '',
      issuer: '',
      notBefore: 0,
      notAfter: 0,
      autoRenew: false,
      description: '',
    };
  }
}
