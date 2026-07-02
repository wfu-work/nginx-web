import { NgClass } from '@angular/common';
import { Component, TemplateRef, ViewChild, inject } from '@angular/core';
import { NzDrawerRef, NzDrawerService } from 'ng-zorro-antd/drawer';
import { NzIconModule } from 'ng-zorro-antd/icon';

import {
  AppearanceFontMode,
  AppearanceMenuDisplay,
  AppearanceSettingsService,
  AppearanceSiderStyle,
  AppearanceThemeMode,
} from '../../../shared/services/appearance-settings.service';

interface ThemeOption {
  key: AppearanceThemeMode;
  label: string;
  tone: 'system' | 'light' | 'dark';
}

interface FontOption {
  key: AppearanceFontMode;
  label: string;
  sampleClass: string;
}

interface SiderOption {
  key: AppearanceSiderStyle;
  label: string;
}

interface MenuOption {
  key: AppearanceMenuDisplay;
  label: string;
  description: string;
}

@Component({
  selector: 'app-appearance',
  standalone: true,
  imports: [NgClass, NzIconModule],
  template: `
    <button
      type="button"
      class="appearance-trigger"
      [attr.aria-label]="'外观设置：' + appearance.currentColor().label"
      title="外观设置"
      (click)="openAppearanceDrawer()"
    >
      <i nz-icon nzType="bg-colors"></i>
      <span
        class="appearance-trigger__swatch"
        [style.background]="appearance.currentColor().primary"
      ></span>
    </button>

    <ng-template #appearanceDrawerContent>
      <section class="appearance-panel">
        <div class="panel-hero">
          <div>
            <span>Nginx Control</span>
            <h2>界面偏好</h2>
            <p>统一调整控制台颜色、明暗主题、字体和侧边栏展示方式。</p>
          </div>
          <button type="button" class="reset-button" (click)="appearance.reset()">
            <i nz-icon nzType="rollback"></i>
            重置
          </button>
        </div>

        <section class="settings-section">
          <div class="section-title">
            <h3>主题颜色</h3>
            <i nz-icon nzType="bg-colors"></i>
          </div>
          <div class="color-list">
            @for (preset of appearance.colorPresets; track preset.key) {
              <button
                type="button"
                class="color-option"
                [class.color-option-active]="appearance.current().color === preset.key"
                (click)="appearance.update({ color: preset.key })"
              >
                <span class="color-preview" [style.background]="preset.primary">
                  <i [style.background]="preset.hover"></i>
                  <b [style.background]="preset.soft"></b>
                </span>
                <span class="color-name">{{ preset.label }}</span>
                @if (appearance.current().color === preset.key) {
                  <span class="color-check"><i nz-icon nzType="check"></i></span>
                }
              </button>
            }
          </div>
        </section>

        <section class="settings-section">
          <div class="section-title">
            <h3>主题</h3>
            <i nz-icon nzType="skin"></i>
          </div>
          <div class="card-grid theme-grid">
            @for (item of themeOptions; track item.key) {
              <button
                type="button"
                class="preview-card theme-card"
                [class.preview-card-active]="appearance.current().theme === item.key"
                (click)="setTheme(item.key)"
              >
                <span class="check-mark"><i nz-icon nzType="check"></i></span>
                <span class="theme-preview" [ngClass]="'theme-preview-' + item.tone">
                  <i></i>
                  <b></b>
                  <em></em>
                </span>
                <strong>{{ item.label }}</strong>
              </button>
            }
          </div>
        </section>

        <section class="settings-section">
          <div class="section-title">
            <h3>字体</h3>
            <i nz-icon nzType="font-size"></i>
          </div>
          <div class="card-grid">
            @for (item of fontOptions; track item.key) {
              <button
                type="button"
                class="preview-card font-card"
                [class.preview-card-active]="appearance.current().font === item.key"
                (click)="appearance.update({ font: item.key })"
              >
                <span class="check-mark"><i nz-icon nzType="check"></i></span>
                <span class="font-sample" [ngClass]="item.sampleClass">Aa</span>
                <strong>{{ item.label }}</strong>
              </button>
            }
          </div>
        </section>

        <section class="settings-section">
          <div class="section-title">
            <h3>侧边栏</h3>
            <i nz-icon nzType="layout"></i>
          </div>
          <div class="card-grid">
            @for (item of siderOptions; track item.key) {
              <button
                type="button"
                class="preview-card sider-card"
                [class.preview-card-active]="appearance.current().siderStyle === item.key"
                (click)="appearance.update({ siderStyle: item.key })"
              >
                <span class="check-mark"><i nz-icon nzType="check"></i></span>
                <span class="sider-preview" [ngClass]="'sider-preview-' + item.key">
                  <i></i>
                  <b></b>
                  <em></em>
                </span>
                <strong>{{ item.label }}</strong>
              </button>
            }
          </div>
        </section>

        <section class="settings-section">
          <div class="section-title">
            <h3>菜单展示</h3>
            <i nz-icon nzType="menu"></i>
          </div>
          <div class="card-grid menu-card-grid">
            @for (item of menuOptions; track item.key) {
              <button
                type="button"
                class="preview-card menu-card"
                [class.preview-card-active]="appearance.current().menuDisplay === item.key"
                (click)="appearance.update({ menuDisplay: item.key })"
              >
                <span class="check-mark"><i nz-icon nzType="check"></i></span>
                <span class="menu-preview" [ngClass]="'menu-preview-' + item.key">
                  <i></i>
                  <b></b>
                  <em></em>
                  <small></small>
                </span>
                <strong>{{ item.label }}</strong>
                <em class="card-desc">{{ item.description }}</em>
              </button>
            }
          </div>
        </section>
      </section>
    </ng-template>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .appearance-trigger {
        position: relative;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 42px;
        height: 42px;
        padding: 0;
        border: 0;
        color: #56657d;
        background: transparent;
        cursor: pointer;
        transition:
          color 0.2s ease,
          transform 0.2s ease;
      }

      .appearance-trigger:hover {
        transform: translateY(-1px);
        color: var(--nm-primary);
      }

      .appearance-trigger .anticon {
        font-size: 18px;
      }

      .appearance-trigger__swatch {
        position: absolute;
        right: 8px;
        bottom: 8px;
        width: 9px;
        height: 9px;
        border: 2px solid rgb(255 255 255 / 92%);
        border-radius: 50%;
        box-shadow: 0 2px 5px rgb(25 39 52 / 18%);
      }

      :host-context(.nm-theme-dark) .appearance-trigger {
        color: rgb(226 232 240 / 78%);
      }

      :host-context(.nm-theme-dark) .appearance-trigger:hover {
        color: #fff;
      }

      :host-context(.nm-theme-dark) .appearance-trigger__swatch {
        border-color: rgb(15 23 42 / 92%);
      }

      .appearance-panel {
        display: grid;
        gap: 22px;
        padding: 4px 2px 22px;
        color: #17312f;
      }

      .panel-hero {
        position: relative;
        overflow: hidden;
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        gap: 18px;
        align-items: center;
        min-height: 118px;
        padding: 22px 24px;
        border: 1px solid rgb(var(--nm-primary-rgb) / 14%);
        border-radius: 22px;
        background:
          radial-gradient(
            circle at 102% -10%,
            rgb(var(--nm-primary-rgb) / 14%) 0 118px,
            transparent 119px
          ),
          linear-gradient(135deg, rgb(var(--nm-primary-rgb) / 7%), #f8fffb);
        box-shadow: inset 0 1px 0 rgb(255 255 255 / 70%);
      }

      .panel-hero::after {
        content: '';
        position: absolute;
        top: -54px;
        right: -62px;
        width: 220px;
        height: 220px;
        border-radius: 50%;
        background: rgb(var(--nm-primary-rgb) / 9%);
        pointer-events: none;
      }

      .panel-hero > div,
      .reset-button {
        position: relative;
        z-index: 1;
      }

      .panel-hero > div > span {
        color: var(--nm-primary);
        font-size: 11px;
        font-weight: 900;
        letter-spacing: 0.12em;
        text-transform: uppercase;
      }

      .panel-hero h2,
      .panel-hero p {
        margin: 0;
      }

      .panel-hero h2 {
        margin-top: 4px;
        color: #143532;
        font-size: 24px;
        font-weight: 850;
        line-height: 1.18;
        letter-spacing: -0.02em;
      }

      .panel-hero p {
        max-width: 300px;
        margin-top: 10px;
        color: #617470;
        font-size: 13px;
        line-height: 1.58;
      }

      .reset-button {
        display: inline-flex;
        gap: 7px;
        align-items: center;
        justify-content: center;
        flex: 0 0 auto;
        min-height: 36px;
        padding: 0 14px;
        border: 1px solid rgb(var(--nm-primary-rgb) / 12%);
        border-radius: 999px;
        color: var(--nm-primary);
        font-size: 12px;
        font-weight: 800;
        background: rgb(255 255 255 / 74%);
        box-shadow: 0 10px 24px rgb(var(--nm-primary-rgb) / 10%);
        cursor: pointer;
        white-space: nowrap;
        transition:
          transform 0.2s ease,
          border-color 0.2s ease,
          background 0.2s ease;
      }

      .reset-button:hover {
        transform: translateY(-1px);
        border-color: rgb(var(--nm-primary-rgb) / 24%);
        background: rgb(var(--nm-primary-rgb) / 9%);
      }

      .settings-section {
        display: grid;
        gap: 12px;
      }

      .section-title {
        display: flex;
        align-items: center;
        justify-content: space-between;
      }

      .section-title h3 {
        margin: 0;
        color: #143532;
        font-size: 16px;
        font-weight: 850;
      }

      .section-title i {
        color: var(--nm-primary);
        font-size: 16px;
      }

      .color-list,
      .card-grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 12px;
      }

      .color-option,
      .preview-card {
        position: relative;
        border: 1px solid #dceeee;
        border-radius: 18px;
        background: #fff;
        cursor: pointer;
        transition:
          border-color 0.18s ease,
          box-shadow 0.18s ease,
          transform 0.18s ease;
      }

      .color-option {
        display: grid;
        justify-items: center;
        gap: 10px;
        min-height: 108px;
        padding: 14px 10px 12px;
        color: #526478;
        text-align: center;
      }

      .preview-card {
        display: grid;
        justify-items: start;
        gap: 10px;
        min-height: 128px;
        padding: 14px;
        color: #0f172a;
        text-align: left;
      }

      .color-option:hover,
      .color-option-active,
      .preview-card:hover,
      .preview-card-active {
        border-color: var(--nm-primary);
        box-shadow: 0 16px 30px rgb(var(--nm-primary-rgb) / 12%);
      }

      .color-option:hover,
      .preview-card:hover {
        transform: translateY(-2px);
      }

      .color-preview {
        position: relative;
        display: block;
        width: 54px;
        height: 54px;
        border: 4px solid rgb(255 255 255 / 88%);
        border-radius: 18px;
        box-shadow:
          inset 0 0 0 1px rgb(255 255 255 / 30%),
          0 12px 22px rgb(25 39 52 / 16%);
      }

      .color-preview i,
      .color-preview b {
        position: absolute;
        display: block;
        border-radius: 999px;
        content: '';
      }

      .color-preview i {
        right: -6px;
        bottom: 6px;
        width: 24px;
        height: 24px;
        border: 3px solid #fff;
      }

      .color-preview b {
        top: 8px;
        left: 8px;
        width: 18px;
        height: 8px;
      }

      .color-name {
        overflow: hidden;
        max-width: 100%;
        color: #26364f;
        font-size: 13px;
        font-weight: 800;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .color-check,
      .check-mark {
        position: absolute;
        display: grid;
        place-items: center;
        border-radius: 50%;
        color: #fff;
        background: var(--nm-primary);
        box-shadow: 0 10px 18px rgb(var(--nm-primary-rgb) / 22%);
      }

      .color-check {
        top: -10px;
        right: -8px;
        width: 32px;
        height: 32px;
      }

      .check-mark {
        top: -12px;
        right: -10px;
        display: none;
        width: 36px;
        height: 36px;
        font-size: 18px;
      }

      .preview-card-active .check-mark {
        display: grid;
      }

      .preview-card strong {
        align-self: end;
        font-size: 14px;
        font-weight: 800;
      }

      .theme-preview,
      .sider-preview,
      .menu-preview {
        position: relative;
        overflow: hidden;
        width: 100%;
        border-radius: 12px;
        background: #eef7f4;
      }

      .theme-preview,
      .sider-preview {
        height: 68px;
      }

      .menu-preview {
        height: 72px;
        background: #f3fbf8;
      }

      .theme-preview i,
      .theme-preview b,
      .theme-preview em,
      .sider-preview i,
      .sider-preview b,
      .sider-preview em,
      .menu-preview i,
      .menu-preview b,
      .menu-preview em,
      .menu-preview small {
        position: absolute;
        display: block;
        content: '';
      }

      .theme-preview i {
        inset: 0 auto 0 0;
        width: 34%;
        background: #cbd8d3;
      }

      .theme-preview b {
        top: 14px;
        right: 12px;
        width: 34px;
        height: 34px;
        border-radius: 50%;
        background: #a7b4b0;
      }

      .theme-preview em {
        top: 38px;
        left: 50%;
        width: 18px;
        height: 22px;
        background: #b8c7c1;
      }

      .theme-preview-light {
        background: #fff;
      }

      .theme-preview-light i {
        background: #d9d9d9;
      }

      .theme-preview-dark {
        background: #102033;
      }

      .theme-preview-dark i {
        background: #243d5e;
      }

      .theme-preview-dark b,
      .theme-preview-dark em {
        background: #315aa2;
      }

      .font-card {
        align-content: center;
        justify-items: center;
        min-height: 110px;
      }

      .font-sample {
        color: #101317;
        font-size: 38px;
        font-weight: 950;
        line-height: 1;
      }

      .font-auto {
        font-family: inherit;
      }

      .font-sans {
        font-family: 'HarmonyOS Sans SC', 'MiSans', 'PingFang SC', 'Microsoft YaHei', sans-serif;
      }

      .font-serif {
        font-family: 'Noto Serif SC', 'Songti SC', STSong, serif;
      }

      .sider-preview i {
        top: 12px;
        bottom: 12px;
        left: 16px;
        width: 36%;
        border-radius: 8px;
        background: rgb(var(--nm-primary-rgb) / 20%);
      }

      .sider-preview b {
        top: 20px;
        left: 28px;
        width: 22%;
        height: 9px;
        background: var(--nm-primary);
      }

      .sider-preview em {
        top: 34px;
        right: 16px;
        width: 34%;
        height: 30px;
        background: rgb(var(--nm-primary-rgb) / 30%);
      }

      .sider-preview-floating i {
        inset: 12px auto 12px 38%;
        width: 36%;
        border-radius: 0;
        background: var(--nm-primary);
      }

      .sider-preview-sidebar i {
        right: 10px;
        left: auto;
        width: 8px;
        border-radius: 999px;
        background: #c5d2cf;
      }

      .sider-preview-sidebar b {
        left: 20px;
        width: 36%;
        background: #4f6a5f;
      }

      .sider-preview-sidebar em {
        top: 36px;
        right: auto;
        left: 20px;
        width: 48%;
        height: 8px;
        background: #cbd7d4;
      }

      .menu-card-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }

      .menu-card {
        min-height: 154px;
      }

      .menu-preview i,
      .menu-preview b,
      .menu-preview em,
      .menu-preview small {
        border-radius: 999px;
      }

      .menu-preview i {
        top: 12px;
        left: 14px;
        width: 34%;
        height: 10px;
        background: var(--nm-primary);
      }

      .menu-preview b {
        top: 30px;
        left: 24px;
        width: 48%;
        height: 8px;
        background: rgb(var(--nm-primary-rgb) / 28%);
      }

      .menu-preview em {
        top: 45px;
        left: 24px;
        width: 40%;
        height: 8px;
        background: rgb(var(--nm-primary-rgb) / 18%);
      }

      .menu-preview small {
        top: 30px;
        right: 16px;
        width: 18px;
        height: 26px;
        border-radius: 8px;
        background: rgb(var(--nm-primary-rgb) / 22%);
      }

      .menu-preview-grouped i {
        left: 12px;
        width: 40%;
      }

      .menu-preview-grouped b {
        top: 30px;
        left: 12px;
        width: 64%;
      }

      .menu-preview-grouped em {
        top: 46px;
        left: 12px;
        width: 54%;
      }

      .menu-preview-grouped small {
        top: 12px;
        right: 12px;
        width: 8px;
        height: 48px;
        border-radius: 999px;
        background: #c6d5d1;
      }

      .card-desc {
        overflow: hidden;
        display: -webkit-box;
        color: #6b7a8f;
        font-size: 11px;
        font-style: normal;
        font-weight: 600;
        line-height: 1.5;
        -webkit-box-orient: vertical;
        -webkit-line-clamp: 2;
      }

      :host-context(.nm-theme-dark) .appearance-panel {
        color: rgb(241 245 249 / 92%);
      }

      :host-context(.nm-theme-dark) .panel-hero {
        border-color: rgb(148 163 184 / 24%);
        background:
          radial-gradient(
            circle at 106% -14%,
            rgb(var(--nm-primary-rgb) / 18%) 0 108px,
            transparent 109px
          ),
          linear-gradient(135deg, rgb(20 35 58 / 98%), rgb(8 15 29 / 98%));
        box-shadow:
          0 20px 44px rgb(0 0 0 / 28%),
          inset 0 1px 0 rgb(255 255 255 / 6%);
      }

      :host-context(.nm-theme-dark) .panel-hero::after {
        background: radial-gradient(
          circle,
          rgb(var(--nm-primary-rgb) / 16%) 0 34%,
          transparent 66%
        );
      }

      :host-context(.nm-theme-dark) .panel-hero h2,
      :host-context(.nm-theme-dark) .section-title h3,
      :host-context(.nm-theme-dark) .preview-card strong,
      :host-context(.nm-theme-dark) .color-name {
        color: rgb(241 245 249 / 92%);
      }

      :host-context(.nm-theme-dark) .panel-hero p,
      :host-context(.nm-theme-dark) .card-desc {
        color: rgb(203 213 225 / 70%);
      }

      :host-context(.nm-theme-dark) .reset-button {
        border-color: rgb(var(--nm-primary-rgb) / 32%);
        color: #d9f99d;
        background: rgb(var(--nm-primary-rgb) / 16%);
        box-shadow: 0 12px 28px rgb(0 0 0 / 22%);
      }

      :host-context(.nm-theme-dark) .color-option,
      :host-context(.nm-theme-dark) .preview-card {
        border-color: rgb(148 163 184 / 14%);
        color: rgb(241 245 249 / 88%);
        background: rgb(15 23 42 / 72%);
      }

      :host-context(.nm-theme-dark) .color-option:hover,
      :host-context(.nm-theme-dark) .color-option-active,
      :host-context(.nm-theme-dark) .preview-card:hover,
      :host-context(.nm-theme-dark) .preview-card-active {
        border-color: rgb(var(--nm-primary-rgb) / 72%);
        box-shadow: 0 18px 34px rgb(0 0 0 / 28%);
      }

      :host-context(.nm-theme-dark) .theme-preview,
      :host-context(.nm-theme-dark) .sider-preview,
      :host-context(.nm-theme-dark) .menu-preview {
        background: rgb(30 41 59 / 74%);
      }

      :host-context(.nm-theme-dark) .font-sample {
        color: rgb(248 250 252 / 94%);
      }

      @media (max-width: 480px) {
        .appearance-trigger {
          width: 38px;
          height: 38px;
        }

        .panel-hero {
          grid-template-columns: 1fr;
          min-height: auto;
          padding: 20px;
        }

        .reset-button {
          width: fit-content;
        }

        .card-grid,
        .color-list,
        .menu-card-grid {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class AppearanceSettingsComponent {
  @ViewChild('appearanceDrawerContent', { static: true })
  private readonly appearanceDrawerContent!: TemplateRef<{
    $implicit: object;
    drawerRef: NzDrawerRef;
  }>;

  protected readonly appearance = inject(AppearanceSettingsService);
  private readonly drawer = inject(NzDrawerService);

  protected readonly themeOptions: ThemeOption[] = [
    { key: 'system', label: '跟随系统', tone: 'system' },
    { key: 'light', label: '浅色', tone: 'light' },
    { key: 'dark', label: '深色', tone: 'dark' },
  ];

  protected readonly fontOptions: FontOption[] = [
    { key: 'auto', label: '默认', sampleClass: 'font-auto' },
    { key: 'sans', label: '黑体', sampleClass: 'font-sans' },
    { key: 'serif', label: '宋体', sampleClass: 'font-serif' },
  ];

  protected readonly siderOptions: SiderOption[] = [
    { key: 'embedded', label: '内嵌' },
    { key: 'floating', label: '浮动' },
    { key: 'sidebar', label: '侧边栏' },
  ];

  protected readonly menuOptions: MenuOption[] = [
    {
      key: 'accordion',
      label: '折叠展开',
      description: '保留当前菜单交互，适合导航项持续增加时保持紧凑。',
    },
    {
      key: 'grouped',
      label: '分组展开',
      description: '二级菜单默认展开，减少运维人员查找层级的成本。',
    },
  ];

  protected setTheme(theme: AppearanceThemeMode): void {
    this.appearance.update({ theme });
  }

  protected openAppearanceDrawer(): void {
    const isDark = this.appearance.resolvedTheme() === 'dark';

    this.drawer.create<object, object>({
      nzTitle: '',
      nzContent: this.appearanceDrawerContent,
      nzWidth: 460,
      nzPlacement: 'right',
      nzClosable: false,
      nzBodyStyle: {
        padding: '18px',
        background: isDark
          ? 'linear-gradient(180deg, #0d1625 0%, #080f1d 100%)'
          : 'linear-gradient(180deg, #f2fffb 0%, #fbfffd 100%)',
      },
    });
  }
}
