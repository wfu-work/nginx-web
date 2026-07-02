import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, computed, effect, inject, signal } from '@angular/core';

import { ThemeColorPreset, THEME_COLOR_PRESETS } from './theme-color.service';

export type AppearanceThemeMode = 'system' | 'light' | 'dark';
export type AppearanceFontMode = 'auto' | 'sans' | 'serif';
export type AppearanceSiderStyle = 'embedded' | 'floating' | 'sidebar';
export type AppearanceMenuDisplay = 'accordion' | 'grouped';

export interface AppearanceSettings {
  color: string;
  theme: AppearanceThemeMode;
  font: AppearanceFontMode;
  siderStyle: AppearanceSiderStyle;
  menuDisplay: AppearanceMenuDisplay;
}

const STORAGE_KEY = 'nginx_control_appearance_settings';

const DEFAULT_APPEARANCE_SETTINGS: AppearanceSettings = {
  color: THEME_COLOR_PRESETS[0].key,
  theme: 'system',
  font: 'auto',
  siderStyle: 'floating',
  menuDisplay: 'accordion',
};

@Injectable({ providedIn: 'root' })
export class AppearanceSettingsService {
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);
  private readonly settings = signal<AppearanceSettings>(this.restoreSettings());
  private mediaQuery?: MediaQueryList;

  readonly colorPresets = THEME_COLOR_PRESETS;
  readonly current = this.settings.asReadonly();
  readonly currentColor = computed(() => this.findColor(this.settings().color));
  readonly resolvedTheme = computed(() => this.resolveTheme(this.settings().theme));

  constructor() {
    if (this.isBrowser) {
      this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      this.mediaQuery.addEventListener('change', this.handleSystemThemeChange);
    }

    effect(() => {
      const settings = this.settings();
      this.applyToDocument(settings);
      this.persist(settings);
    });
  }

  update(patch: Partial<AppearanceSettings>): void {
    this.settings.update((current) => this.normalizeSettings({ ...current, ...patch }));
  }

  reset(): void {
    this.settings.set({ ...DEFAULT_APPEARANCE_SETTINGS });
  }

  isColorActive(key: string): boolean {
    return this.settings().color === key;
  }

  private restoreSettings(): AppearanceSettings {
    if (!this.isBrowser) return { ...DEFAULT_APPEARANCE_SETTINGS };

    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_APPEARANCE_SETTINGS };

    try {
      return this.normalizeSettings({
        ...DEFAULT_APPEARANCE_SETTINGS,
        ...(JSON.parse(raw) as Partial<AppearanceSettings>),
      });
    } catch {
      return { ...DEFAULT_APPEARANCE_SETTINGS };
    }
  }

  private persist(settings: AppearanceSettings): void {
    if (!this.isBrowser) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }

  private normalizeSettings(settings: AppearanceSettings): AppearanceSettings {
    return {
      color: this.findColor(settings.color).key,
      theme: ['system', 'light', 'dark'].includes(settings.theme) ? settings.theme : 'system',
      font: ['auto', 'sans', 'serif'].includes(settings.font) ? settings.font : 'auto',
      siderStyle: ['embedded', 'floating', 'sidebar'].includes(settings.siderStyle)
        ? settings.siderStyle
        : 'floating',
      menuDisplay: ['accordion', 'grouped'].includes(settings.menuDisplay)
        ? settings.menuDisplay
        : 'accordion',
    };
  }

  private findColor(key: string): ThemeColorPreset {
    return THEME_COLOR_PRESETS.find((preset) => preset.key === key) ?? THEME_COLOR_PRESETS[0];
  }

  private resolveTheme(theme: AppearanceThemeMode): 'light' | 'dark' {
    if (theme !== 'system') return theme;
    return this.mediaQuery?.matches ? 'dark' : 'light';
  }

  private applyToDocument(settings: AppearanceSettings): void {
    const root = this.document.documentElement;
    const color = this.findColor(settings.color);
    const resolvedTheme = this.resolveTheme(settings.theme);

    root.style.setProperty('--nm-primary', color.primary);
    root.style.setProperty('--nm-primary-hover', color.hover);
    root.style.setProperty('--nm-primary-active', color.active);
    root.style.setProperty('--nm-primary-soft', color.soft);
    root.style.setProperty('--nm-primary-tint', color.tint);
    root.style.setProperty('--nm-primary-rgb', color.rgb);
    root.dataset['theme'] = resolvedTheme;

    root.classList.toggle('nm-theme-dark', resolvedTheme === 'dark');
    root.classList.toggle('nm-theme-light', resolvedTheme === 'light');
    this.syncClass(root, 'nm-font-', settings.font);
    this.syncClass(root, 'nm-sider-', settings.siderStyle);
    this.syncClass(root, 'nm-menu-', settings.menuDisplay);
  }

  private syncClass(root: HTMLElement, prefix: string, value: string): void {
    Array.from(root.classList)
      .filter((className) => className.startsWith(prefix))
      .forEach((className) => root.classList.remove(className));
    root.classList.add(`${prefix}${value}`);
  }

  private readonly handleSystemThemeChange = (): void => {
    if (this.settings().theme === 'system') {
      this.applyToDocument(this.settings());
    }
  };
}
