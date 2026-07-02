import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { STColumn, STPage } from '@delon/abc/st';
import { SHARED_IMPORTS, TitleLabelComponent } from '@shared';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { finalize } from 'rxjs';

import { CertificateOption, LocationRule, SiteRecord, SiteService } from '../site.service';

type SiteForm = SiteRecord & {
  name: string;
  serverName: string;
  listen: string;
  enabled: boolean;
  root: string;
  index: string;
  accessLog: string;
  errorLog: string;
  certificateGuid: string;
  ssl: boolean;
  extraConfig: string;
};

type LocationForm = LocationRule & {
  siteGuid: string;
  path: string;
  proxyPass: string;
  root: string;
  extraConfig: string;
  sort: number | null;
};

@Component({
  selector: 'nginx-site-edit',
  imports: [SHARED_IMPORTS, TitleLabelComponent, NzTagModule],
  templateUrl: './site-edit.component.html',
  styleUrls: ['./site-edit.component.less'],
})
export class SiteEditComponent implements OnInit {
  private readonly siteService = inject(SiteService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly message = inject(NzMessageService);

  protected readonly saving = signal(false);
  protected readonly loading = signal(false);
  protected readonly locationSaving = signal(false);
  protected readonly isEdit = signal(false);
  protected readonly certificates = signal<CertificateOption[]>([]);
  protected readonly locations = signal<LocationRule[]>([]);

  protected model: SiteForm = this.siteDefaults();
  protected locationModel: LocationForm = this.locationDefaults();

  protected readonly locationPage: STPage = {
    front: true,
    show: false,
  };

  protected readonly locationColumns: Array<STColumn<LocationRule>> = [
    { title: '路径', render: 'pathTpl', width: 180 },
    { title: '转发 / 目录', render: 'targetTpl' },
    { title: '排序', render: 'sortTpl', width: 90 },
    { title: '操作', render: 'locationActionTpl', width: 140 },
  ];

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    this.isEdit.set(!!id);
    this.loadCertificates();
    if (!id) return;
    this.loadSite(id);
  }

  protected save(): void {
    if (this.saving() || this.loading()) return;
    const body = this.normalizeSite();
    const validationError = this.validateSite(body);
    if (validationError) {
      this.message.warning(validationError);
      return;
    }

    this.saving.set(true);
    const request = this.isEdit() ? this.siteService.update(body) : this.siteService.create(body);
    request.pipe(finalize(() => this.saving.set(false))).subscribe({
      next: () => {
        this.message.success(this.isEdit() ? '站点已更新' : '站点已创建');
        if (!this.isEdit()) {
          this.router.navigate(['/nginx/sites']);
        }
      },
    });
  }

  protected cancel(): void {
    this.router.navigate(['/nginx/sites']);
  }

  protected canSubmit(): boolean {
    return !this.saving() && !this.loading() && this.trimSite('name').length > 0 && this.trimSite('serverName').length > 0;
  }

  protected canSaveLocation(): boolean {
    return this.isEdit() && !this.locationSaving() && this.currentSiteGuid().length > 0 && this.trimLocation('path').length > 0;
  }

  protected saveLocation(): void {
    if (!this.canSaveLocation()) {
      this.message.warning(this.isEdit() ? '请填写 Location 路径' : '请先保存站点后再维护 Location');
      return;
    }

    const siteGuid = this.currentSiteGuid();
    const body = this.normalizeLocation(siteGuid);
    this.locationSaving.set(true);
    const request = body.guid ? this.siteService.updateLocation(siteGuid, body) : this.siteService.createLocation(siteGuid, body);
    request.pipe(finalize(() => this.locationSaving.set(false))).subscribe({
      next: () => {
        this.message.success(body.guid ? 'Location 已更新' : 'Location 已添加');
        this.resetLocation();
        this.loadSite(siteGuid, false);
      },
    });
  }

  protected editLocation(row: LocationRule): void {
    this.locationModel = {
      ...this.locationDefaults(),
      ...row,
      siteGuid: row.siteGuid || this.currentSiteGuid(),
      sort: row.sort ?? 0,
    };
  }

  protected removeLocation(row: LocationRule): void {
    const siteGuid = row.siteGuid || this.currentSiteGuid();
    const locationGuid = row.guid;
    if (!siteGuid || !locationGuid) return;

    this.siteService.deleteLocation(siteGuid, locationGuid).subscribe({
      next: () => {
        this.message.success('Location 已删除');
        this.loadSite(siteGuid, false);
      },
    });
  }

  protected resetLocation(): void {
    this.locationModel = this.locationDefaults(this.currentSiteGuid());
  }

  protected currentSiteGuid(): string {
    return this.model.guid || this.route.snapshot.paramMap.get('id') || '';
  }

  protected certificateLabel(cert: CertificateOption): string {
    const serverName = cert.serverName ? ` · ${cert.serverName}` : '';
    return `${cert.name}${serverName}`;
  }

  private loadSite(id: string, showLoading = true): void {
    if (showLoading) this.loading.set(true);
    this.siteService
      .detail(id)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe((detail) => {
        this.model = {
          ...this.siteDefaults(),
          ...detail.site,
          enabled: detail.site.enabled !== false,
          ssl: detail.site.ssl === true,
        };
        this.locations.set(detail.locations || []);
        this.resetLocation();
      });
  }

  private loadCertificates(): void {
    this.siteService.certificates().subscribe({
      next: (result) => this.certificates.set(result.data || []),
    });
  }

  private normalizeSite(): SiteRecord {
    return {
      ...this.model,
      name: this.trimSite('name'),
      serverName: this.trimSite('serverName'),
      listen: this.trimSite('listen') || '80',
      enabled: this.model.enabled !== false,
      root: this.trimSite('root'),
      index: this.trimSite('index') || 'index.html index.htm',
      accessLog: this.trimSite('accessLog'),
      errorLog: this.trimSite('errorLog'),
      certificateGuid: this.trimSite('certificateGuid'),
      ssl: this.model.ssl === true,
      extraConfig: this.trimSite('extraConfig'),
    };
  }

  private validateSite(body: SiteRecord): string {
    if (!body.name) return '请填写站点名称';
    if (!body.serverName) return '请填写域名';
    return '';
  }

  private normalizeLocation(siteGuid: string): LocationRule {
    return {
      ...this.locationModel,
      siteGuid,
      path: this.trimLocation('path') || '/',
      proxyPass: this.trimLocation('proxyPass'),
      root: this.trimLocation('root'),
      extraConfig: this.trimLocation('extraConfig'),
      sort: Number(this.locationModel.sort || 0),
    };
  }

  private trimSite(key: keyof SiteForm): string {
    return String(this.model[key] || '').trim();
  }

  private trimLocation(key: keyof LocationForm): string {
    return String(this.locationModel[key] || '').trim();
  }

  private siteDefaults(): SiteForm {
    return {
      name: '',
      serverName: '',
      listen: '80',
      enabled: true,
      root: '',
      index: 'index.html index.htm',
      accessLog: '',
      errorLog: '',
      certificateGuid: '',
      ssl: false,
      extraConfig: '',
    };
  }

  private locationDefaults(siteGuid = ''): LocationForm {
    return {
      siteGuid,
      path: '/',
      proxyPass: 'http://127.0.0.1:8080',
      root: '',
      extraConfig: '',
      sort: 0,
    };
  }
}
