import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject } from '@angular/core';
import { AbstractControl, FormBuilder, ValidationErrors, Validators } from '@angular/forms';
import { DA_SERVICE_TOKEN, ITokenModel, ITokenService } from '@delon/auth';
import { _HttpClient, SettingsService, User } from '@delon/theme';
import { SHARED_IMPORTS, TitleLabelComponent } from '@shared';
import { NzMessageService } from 'ng-zorro-antd/message';
import { finalize, forkJoin, switchMap } from 'rxjs';

interface ProfileUser extends User {
  username?: string;
  nickName?: string;
  phone?: string;
  avatarUrl?: string;
  roleCodeList?: string[];
  abilities?: string[];
}

interface ProfileToken extends ITokenModel {
  username?: string;
  password?: string;
  remember?: boolean;
  exp?: number;
  role?: string | string[];
  roles?: string | string[];
  roleCodeList?: string | string[];
}

interface SummaryItem {
  label: string;
  value: string;
  hint: string;
  icon: string;
  tone: 'primary' | 'success' | 'warning' | 'plain';
}

interface InfoItem {
  label: string;
  value: string;
  icon: string;
}

@Component({
  selector: 'app-system-profile',
  imports: [SHARED_IMPORTS, TitleLabelComponent],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileComponent {
  private readonly settingsService = inject(SettingsService);
  private readonly tokenService: ITokenService = inject(DA_SERVICE_TOKEN);
  private readonly fb = inject(FormBuilder);
  private readonly http = inject(_HttpClient);
  private readonly message = inject(NzMessageService);
  private readonly cdr = inject(ChangeDetectorRef);

  protected readonly user = this.settingsService.user as ProfileUser;
  protected readonly token =
    this.tokenService.get<ProfileToken>() ?? ({ token: null } as ProfileToken);
  protected passwordLoading = false;

  protected readonly passwordForm = this.fb.nonNullable.group(
    {
      oldPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]],
    },
    { validators: this.passwordsMatch },
  );

  protected get displayName(): string {
    return this.user.nickName || this.user.name || this.token.username || 'Admin';
  }

  protected get accountName(): string {
    return this.token.username || this.user.username || this.displayName;
  }

  protected get avatar(): string {
    return this.user.avatar || this.user.avatarUrl || 'assets/avatar.gif';
  }

  protected get roles(): string[] {
    const userRoles = this.normalizeList(this.user.roleCodeList);
    const tokenRoles = this.normalizeList(
      this.token.roleCodeList || this.token.roles || this.token.role,
    );
    return userRoles.length ? userRoles : tokenRoles.length ? tokenRoles : ['ADMIN'];
  }

  protected get abilitiesText(): string {
    const abilities = this.normalizeList(this.user.abilities);
    return abilities.length ? abilities.join('、') : '全部权限';
  }

  protected get expiredText(): string {
    return this.formatTime(this.normalizeTime(this.token.expired ?? this.token.exp));
  }

  protected get remainText(): string {
    const expired = this.normalizeTime(this.token.expired ?? this.token.exp);
    if (!expired) return '未设置过期时间';
    const diff = expired - Date.now();
    if (diff <= 0) return '已过期';
    const minutes = Math.ceil(diff / 60_000);
    if (minutes < 60) return `${minutes} 分钟后过期`;
    const hours = Math.ceil(minutes / 60);
    if (hours < 24) return `${hours} 小时后过期`;
    return `${Math.ceil(hours / 24)} 天后过期`;
  }

  protected summaryItems(): SummaryItem[] {
    return [
      {
        label: '登录账号',
        value: this.accountName,
        hint: '当前会话身份',
        icon: 'user',
        tone: 'primary',
      },
      {
        label: '登录状态',
        value: this.isTokenValid() ? '已登录' : '登录异常',
        hint: this.remainText,
        icon: this.isTokenValid() ? 'check-circle' : 'warning',
        tone: this.isTokenValid() ? 'success' : 'warning',
      },
      {
        label: '角色数量',
        value: `${this.roles.length}`,
        hint: this.roles.join('、'),
        icon: 'safety-certificate',
        tone: 'plain',
      },
      {
        label: '记住登录',
        value: this.token.remember === false ? '未开启' : '已开启',
        hint: '本地登录凭证保存状态',
        icon: 'clock-circle',
        tone: 'plain',
      },
    ];
  }

  protected accountInfo(): InfoItem[] {
    return [
      { label: '显示名称', value: this.displayName, icon: 'idcard' },
      { label: '登录账号', value: this.accountName, icon: 'user' },
      { label: '邮箱', value: this.user.email || '-', icon: 'mail' },
      { label: '手机号', value: this.user.phone || '-', icon: 'phone' },
    ];
  }

  protected securityInfo(): InfoItem[] {
    return [
      { label: '角色', value: this.roles.join('、'), icon: 'team' },
      { label: '权限范围', value: this.abilitiesText, icon: 'key' },
      { label: 'Token 有效期', value: this.expiredText, icon: 'clock-circle' },
      { label: 'Token 摘要', value: this.maskedToken(), icon: 'safety' },
    ];
  }

  protected changePassword(): void {
    this.passwordForm.markAllAsTouched();
    Object.values(this.passwordForm.controls).forEach((control) => {
      control.markAsDirty();
      control.updateValueAndValidity({ onlySelf: true });
    });
    this.passwordForm.updateValueAndValidity();
    if (this.passwordForm.invalid) {
      this.message.warning('请先补齐并确认新密码');
      return;
    }

    const { oldPassword, newPassword } = this.passwordForm.getRawValue();
    if (oldPassword === newPassword) {
      this.message.warning('新密码不能和原密码相同');
      return;
    }

    this.passwordLoading = true;
    forkJoin({
      oldPassword: this.http.post<string>('/secret/encrypt', oldPassword),
      newPassword: this.http.post<string>('/secret/encrypt', newPassword),
    })
      .pipe(
        switchMap((payload) => this.http.put<boolean>('/user/update/password', payload)),
        finalize(() => {
          this.passwordLoading = false;
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: () => {
          const currentToken = this.tokenService.get<ProfileToken>();
          if (currentToken) {
            this.tokenService.set({ ...currentToken, password: undefined });
          }
          this.passwordForm.reset();
          this.message.success('密码已更新，请牢记新密码');
        },
        error: (err) => this.message.error(err?.msg || err?.message || '密码修改失败'),
      });
  }

  private isTokenValid(): boolean {
    if (!this.token.token) return false;
    const expired = this.normalizeTime(this.token.expired ?? this.token.exp);
    return !expired || expired > Date.now();
  }

  private normalizeList(value?: string | string[]): string[] {
    if (!value) return [];
    const list = Array.isArray(value) ? value : value.split(',');
    return list.map((item) => `${item}`.trim()).filter(Boolean);
  }

  private normalizeTime(value?: number): number | null {
    if (!value) return null;
    return value > 10_000_000_000 ? value : value * 1000;
  }

  private formatTime(value: number | null): string {
    if (!value) return '未设置';
    return new Date(value).toLocaleString('zh-CN');
  }

  private maskedToken(): string {
    const token = this.token.token || '';
    if (!token) return '-';
    if (token.length <= 18) return `${token.slice(0, 6)}...`;
    return `${token.slice(0, 10)}...${token.slice(-6)}`;
  }

  private passwordsMatch(control: AbstractControl): ValidationErrors | null {
    const newPassword = control.get('newPassword')?.value;
    const confirmPassword = control.get('confirmPassword')?.value;
    if (!newPassword || !confirmPassword || newPassword === confirmPassword) return null;
    return { passwordMismatch: true };
  }
}
