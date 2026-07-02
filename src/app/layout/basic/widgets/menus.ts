import { NgClass } from '@angular/common';
import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LogoComponent } from '@shared';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMenuModule } from 'ng-zorro-antd/menu';

import { AppearanceSettingsService } from '../../../shared/services/appearance-settings.service';

interface MenuChild {
  label: string;
  link: string;
  icon: string;
}

interface MenuGroup {
  title: string;
  icon: string;
  children: MenuChild[];
}

@Component({
  selector: 'basic-menus',
  template: `
    <div class="sider-inner">
      <div class="sider-top">
        <a
          routerLink="/"
          class="logo-a long-text"
          [ngClass]="{ 'load-resources': spin }"
          (mouseenter)="loadResourcesChange.emit(true)"
          (mouseleave)="loadResourcesChange.emit(false)"
        >
          <logo class="logo" />
          @if (!isCollapsed) {
            <span>Nginx Control</span>
          }
        </a>
        @if (!isCollapsed) {
          <p class="text-center mb-sm text-grey-dark">Nginx 可视化运维台</p>
        }
      </div>

      <div class="menu-scroll">
        <ul
          class="menu-list"
          nz-menu
          nzTheme="light"
          nzMode="inline"
          [nzInlineCollapsed]="isCollapsed"
        >
          @if (appearance.current().menuDisplay === 'grouped' && !isCollapsed) {
            @for (section of groupedMenuSections; track section.title; let first = $first) {
              @if (!first) {
                <li class="menu-section-divider"></li>
              }
              <li class="menu-section-title">{{ section.title }}</li>
              @for (child of section.children; track child.link) {
                <li class="menu-section-item" nz-menu-item nzMatchRouter [routerLink]="child.link">
                  <i nz-icon [nzType]="child.icon"></i>
                  <span>{{ child.label }}</span>
                </li>
              }
            }
          } @else {
            <li nz-menu-item nzMatchRouter routerLink="/nginx/dashboard">
              <i nz-icon nzType="dashboard"></i>
              <span>工作台</span>
            </li>
            @for (group of menuGroups; track group.title) {
              <li nz-submenu [nzTitle]="group.title" [nzIcon]="group.icon">
                <ul>
                  @for (child of group.children; track child.link) {
                    <li nz-menu-item nzMatchRouter [routerLink]="child.link">
                      <i nz-icon [nzType]="child.icon"></i>
                      <span>{{ child.label }}</span>
                    </li>
                  }
                </ul>
              </li>
            }
          }
        </ul>
      </div>

      <div class="sidebar-bottom">
        <a routerLink="/guide" class="sidebar-bottom-item" nzMatchRouter>
          <i nz-icon nzType="question-circle"></i>
          @if (!isCollapsed) {
            <span>使用指南</span>
          }
        </a>
        <button
          type="button"
          class="sidebar-bottom-item sidebar-bottom-item-button"
          (click)="logout.emit()"
        >
          <i nz-icon nzType="logout"></i>
          @if (!isCollapsed) {
            <span>退出登录</span>
          }
        </button>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: flex;
        flex: 1;
        min-height: 0;
      }

      .sider-inner {
        display: flex;
        flex: 1;
        flex-direction: column;
        height: 100%;
        min-height: 0;
        backdrop-filter: blur(18px);
      }

      .sider-top {
        flex: 0 0 auto;
      }

      .logo-a {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 12px 4px;
        font-size: 26px;
        font-weight: 680;
        color: rgb(0 0 0 / 90%);
        animation: move 5s infinite;
      }

      .logo {
        width: 92px;
        height: 92px;
        margin-right: 6px;
        text-align: center;
        object-fit: contain;
      }

      .logo-a.long-text {
        flex-direction: column;
        align-items: center;
        text-align: center;
      }

      .logo-a.load-resources .logo {
        animation: spin 2s linear infinite;
      }

      @keyframes spin {
        to {
          transform-origin: center;
          transform: rotate(360deg);
        }
      }

      .menu-scroll {
        scrollbar-width: none;
        overflow: hidden auto;
        overscroll-behavior: contain;
        flex: 1;
        min-height: 0;
        margin-top: 8px;
        -webkit-overflow-scrolling: touch;
        -ms-overflow-style: none;
      }

      .menu-scroll::-webkit-scrollbar {
        display: none;
      }

      .menu-list {
        overflow: visible;
        width: 100%;
        min-height: 100%;
        padding-top: 4px;
        background: transparent;
      }

      .sidebar-bottom {
        display: flex;
        flex: 0 0 auto;
        flex-direction: column;
        gap: 8px;
        margin-top: 12px;
        padding-top: 14px;
        border-top: 1px solid rgb(var(--nm-primary-rgb) / 6%);
        background: transparent;
      }

      .sidebar-bottom-item {
        display: flex;
        gap: 14px;
        align-items: center;
        width: 100%;
        min-height: 44px;
        padding: 0 14px;
        border-radius: 14px;
        font-size: 15px;
        font-weight: 600;
        color: #5d6b82;
        text-decoration: none;
        transition: all 0.2s ease;
      }

      .sidebar-bottom-item:hover {
        color: #203049;
        background: rgb(var(--nm-primary-rgb) / 4%);
      }

      .sidebar-bottom-item-button {
        cursor: pointer;
        border: 0;
        background: transparent;
      }

      :host-context(.nm-sider-sidebar) .logo-a,
      :host-context(.nm-theme-dark) .logo-a {
        color: rgb(241 245 249 / 94%);
      }

      :host-context(.nm-sider-sidebar) .sider-top p,
      :host-context(.nm-theme-dark) .sider-top p {
        color: rgb(203 213 225 / 62%) !important;
      }

      :host-context(.nm-sider-sidebar) .sidebar-bottom,
      :host-context(.nm-theme-dark) .sidebar-bottom {
        border-top-color: rgb(148 163 184 / 12%);
      }

      :host-context(.nm-sider-sidebar) .sidebar-bottom-item,
      :host-context(.nm-theme-dark) .sidebar-bottom-item {
        color: rgb(203 213 225 / 78%);
      }

      :host-context(.nm-sider-sidebar) .sidebar-bottom-item:hover,
      :host-context(.nm-theme-dark) .sidebar-bottom-item:hover {
        color: #fff;
        background: rgb(var(--nm-primary-rgb) / 14%);
      }

      :host-context(.app-sider.ant-layout-sider-collapsed) .sider-top {
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 6px;
      }

      :host-context(.app-sider.ant-layout-sider-collapsed) .logo-a {
        padding: 6px 0 2px;
      }

      :host-context(.app-sider.ant-layout-sider-collapsed) .logo {
        width: 54px;
        height: 54px;
        margin-right: 0;
      }

      :host-context(.app-sider.ant-layout-sider-collapsed) .sidebar-bottom {
        align-items: center;
        margin-top: 8px;
        padding-top: 10px;
      }

      :host-context(.app-sider.ant-layout-sider-collapsed) .sidebar-bottom-item {
        justify-content: center;
        padding-inline: 0;
      }

      :host ::ng-deep {
        .menu-list .anticon {
          width: 18px;
          height: 18px;
          font-size: 18px;
          color: #5d6b82;
        }

        .sidebar-bottom-item .anticon {
          width: 18px;
          height: 18px;
          font-size: 16px;
        }

        .ant-menu-vertical > .ant-menu-item,
        .ant-menu-vertical-left > .ant-menu-item,
        .ant-menu-vertical-right > .ant-menu-item,
        .ant-menu-inline > .ant-menu-item,
        .ant-menu-vertical > .ant-menu-submenu > .ant-menu-submenu-title,
        .ant-menu-vertical-left > .ant-menu-submenu > .ant-menu-submenu-title,
        .ant-menu-vertical-right > .ant-menu-submenu > .ant-menu-submenu-title,
        .ant-menu-inline > .ant-menu-submenu > .ant-menu-submenu-title {
          height: 46px;
          line-height: 46px;
        }

        .ant-menu {
          font-size: 15px;
          color: #55637a;
        }

        .ant-menu-light,
        .ant-menu-light .ant-menu-sub {
          background: transparent;
        }

        .ant-menu-inline {
          border-inline-end: 0;
        }

        .ant-menu-inline .ant-menu-item,
        .ant-menu-inline .ant-menu-submenu-title {
          position: relative;
          overflow: visible;
          display: flex;
          align-items: center;
          box-sizing: border-box;
          width: auto;
          margin: 0 4px 8px;
          padding-inline: 16px !important;
          border-radius: 999px;
          font-size: 15px;
          font-weight: 600;
          color: #5d6b82;
          transition:
            background-color 0.2s ease,
            color 0.2s ease,
            box-shadow 0.2s ease;
        }

        .ant-menu-inline .ant-menu-item .anticon,
        .ant-menu-inline .ant-menu-submenu-title .anticon {
          color: #56657d;
          transition: color 0.2s ease;
        }

        .ant-menu-inline .ant-menu-item::after,
        .ant-menu-inline .ant-menu-submenu-title::after {
          display: none;
        }

        .ant-menu-inline .ant-menu-item a,
        .ant-menu-inline .ant-menu-submenu-title span,
        .ant-menu-inline .ant-menu-submenu-title .ant-menu-title-content {
          color: inherit;
        }

        .ant-menu-item-selected,
        .ant-menu-inline .ant-menu-item-selected {
          color: #fff !important;
          background: linear-gradient(
            90deg,
            var(--nm-primary) 0%,
            var(--nm-primary-hover) 100%
          ) !important;
        }

        .ant-menu-item-selected .anticon,
        .ant-menu-inline .ant-menu-item-selected .anticon {
          color: #fff !important;
        }

        .ant-menu-inline .ant-menu-item-selected a,
        .ant-menu-inline .ant-menu-submenu-selected > .ant-menu-submenu-title,
        .ant-menu-inline .ant-menu-submenu-selected > .ant-menu-submenu-title .anticon,
        .ant-menu-inline
          .ant-menu-submenu-selected
          > .ant-menu-submenu-title
          .ant-menu-title-content {
          color: #fff !important;
        }

        .ant-menu-inline .ant-menu-submenu-selected > .ant-menu-submenu-title {
          background: linear-gradient(
            90deg,
            var(--nm-primary) 0%,
            var(--nm-primary-hover) 100%
          ) !important;
          box-shadow: 0 10px 24px rgb(var(--nm-primary-rgb) / 20%);
        }

        .ant-menu-inline .ant-menu-item:hover,
        .ant-menu-inline .ant-menu-submenu-title:hover {
          color: #203049;
          background: rgb(var(--nm-primary-rgb) / 4%);
        }

        .ant-menu-inline .ant-menu-submenu-open > .ant-menu-submenu-title,
        .ant-menu-inline .ant-menu-submenu-selected > .ant-menu-submenu-title {
          color: #203049;
        }

        .ant-menu-sub.ant-menu-inline {
          padding-top: 2px;
          padding-bottom: 2px;
        }

        .ant-menu-sub.ant-menu-inline .ant-menu-item {
          width: auto;
          height: 46px;
          margin-right: 34px;
          margin-bottom: 6px;
          margin-left: 26px;
          border-radius: 16px;
          font-size: 14px;
          font-weight: 500;
          line-height: 46px;
          background: transparent;
        }

        .ant-menu-submenu-open {
          border: 12px;
        }

        .ant-menu-sub.ant-menu-inline .ant-menu-item-selected {
          color: var(--nm-primary) !important;
          background: rgb(var(--nm-primary-rgb) / 10%) !important;
          box-shadow: none;
        }

        .ant-menu-sub.ant-menu-inline .ant-menu-item-selected .anticon,
        .ant-menu-sub.ant-menu-inline .ant-menu-item-selected a {
          color: var(--nm-primary) !important;
        }

        .menu-section-divider {
          height: 1px;
          margin: 10px 8px 12px;
          background: rgb(var(--nm-primary-rgb) / 8%);
          list-style: none;
          pointer-events: none;
        }

        .menu-section-title {
          margin: 0 0 4px;
          padding: 0 14px;
          color: #8b96a6;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 0;
          line-height: 24px;
          list-style: none;
          pointer-events: none;
        }

        .menu-list.ant-menu-inline .menu-section-item {
          height: 42px;
          margin: 0 6px 4px;
          padding-inline: 14px !important;
          border-radius: 999px;
          font-size: 14px;
          font-weight: 600;
          line-height: 42px;
        }

        .menu-list.ant-menu-inline .menu-section-item .anticon {
          width: 16px;
          height: 16px;
          margin-right: 10px;
          font-size: 16px;
          color: #737b8a;
        }

        .menu-list.ant-menu-inline .menu-section-item.ant-menu-item-selected {
          color: #172033 !important;
          background: rgb(var(--nm-primary-rgb) / 10%) !important;
          box-shadow: none;
        }

        .menu-list.ant-menu-inline .menu-section-item.ant-menu-item-selected .anticon,
        .menu-list.ant-menu-inline .menu-section-item.ant-menu-item-selected a {
          color: #172033 !important;
        }
      }

      :host-context(.app-sider.ant-layout-sider-collapsed) ::ng-deep {
        .menu-list.ant-menu-inline-collapsed {
          width: 52px;
          margin-inline: auto;
        }

        .menu-list .ant-menu-item,
        .menu-list .ant-menu-submenu-title {
          justify-content: center;
          margin-right: 0;
          margin-left: 0;
        }

        .menu-list .ant-menu-item .anticon,
        .menu-list .ant-menu-submenu-title .anticon {
          transform: none !important;
          display: inline-flex !important;
          align-items: center;
          justify-content: center;
          width: 20px;
          height: 20px;
          margin: 0 !important;
          font-size: 20px !important;
          color: #56657d !important;
          visibility: visible !important;
          opacity: 1 !important;
        }

        .menu-list.ant-menu-inline-collapsed
          > .ant-menu-submenu
          > .ant-menu-submenu-title
          .ant-menu-title-content,
        .menu-list.ant-menu-inline-collapsed .ant-menu-submenu-arrow {
          display: none !important;
        }

        .menu-list.ant-menu-inline-collapsed > .ant-menu-item > .ant-menu-title-content {
          display: inline-flex !important;
          align-items: center;
          justify-content: center;
          width: 100%;
          overflow: visible;
          opacity: 1 !important;
        }

        .menu-list.ant-menu-inline-collapsed
          > .ant-menu-item
          > .ant-menu-title-content
          > span:not(.anticon) {
          display: none !important;
        }

        .sidebar-bottom-item .anticon {
          margin: 0;
          font-size: 18px;
        }

        .menu-list.ant-menu-inline-collapsed > .ant-menu-item,
        .menu-list.ant-menu-inline-collapsed > .ant-menu-submenu > .ant-menu-submenu-title,
        .sidebar-bottom-item {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 52px;
          height: 52px;
          min-height: 52px;
          padding-inline: 0 !important;
          margin-right: auto;
          margin-left: auto;
          border-radius: 16px;
        }

        .ant-menu-inline .ant-menu-item-selected .anticon,
        .ant-menu-inline .ant-menu-submenu-selected > .ant-menu-submenu-title .anticon {
          color: #fff !important;
        }

        .ant-menu-inline .ant-menu-item-selected,
        .ant-menu-inline .ant-menu-submenu-selected > .ant-menu-submenu-title {
          box-shadow: 0 10px 22px rgb(var(--nm-primary-rgb) / 18%);
        }

        .ant-menu-sub.ant-menu-inline {
          display: none;
        }
      }

      :host-context(.nm-sider-sidebar) ::ng-deep,
      :host-context(.nm-theme-dark) ::ng-deep {
        .menu-section-divider {
          background: rgb(148 163 184 / 12%);
        }

        .menu-section-title {
          color: rgb(203 213 225 / 50%);
        }

        .menu-list.ant-menu-inline .menu-section-item .anticon {
          color: rgb(203 213 225 / 65%);
        }

        .menu-list.ant-menu-inline .menu-section-item.ant-menu-item-selected {
          color: #fff !important;
          background: rgb(var(--nm-primary-rgb) / 24%) !important;
        }

        .menu-list.ant-menu-inline .menu-section-item.ant-menu-item-selected .anticon,
        .menu-list.ant-menu-inline .menu-section-item.ant-menu-item-selected a {
          color: #fff !important;
        }
      }
    `,
  ],
  imports: [NgClass, RouterLink, LogoComponent, NzIconModule, NzMenuModule],
})
export class BasicMenusComponent {
  protected readonly appearance = inject(AppearanceSettingsService);

  @Input() isCollapsed = false;
  @Input() spin = false;

  @Output() readonly loadResourcesChange = new EventEmitter<boolean>();
  @Output() readonly logout = new EventEmitter<void>();

  protected readonly menuGroups: MenuGroup[] = [
    {
      title: '运行管理',
      icon: 'cloud-server',
      children: [
        { label: '节点管理', link: '/nginx/nodes', icon: 'cluster' },
        { label: '站点配置', link: '/nginx/sites', icon: 'appstore' },
        { label: '上游服务', link: '/nginx/upstreams', icon: 'api' },
        { label: '证书管理', link: '/nginx/certificates', icon: 'safety-certificate' },
      ],
    },
    {
      title: '配置发布',
      icon: 'deployment-unit',
      children: [
        { label: '配置预览', link: '/configs/preview', icon: 'file-search' },
        { label: '校验发布', link: '/configs/publish', icon: 'deployment-unit' },
        { label: '版本历史', link: '/configs/versions', icon: 'history' },
        { label: '发布任务', link: '/configs/tasks', icon: 'profile' },
      ],
    },
    {
      title: '观测审计',
      icon: 'audit',
      children: [
        { label: '日志与审计', link: '/nginx/logs', icon: 'audit' },
        { label: '审计记录', link: '/audit', icon: 'profile' },
      ],
    },
    {
      title: '系统',
      icon: 'setting',
      children: [{ label: '运行设置', link: '/nginx/settings', icon: 'setting' }],
    },
  ];

  protected readonly groupedMenuSections: MenuGroup[] = [
    {
      title: '概览',
      icon: 'dashboard',
      children: [{ label: '工作台', link: '/nginx/dashboard', icon: 'dashboard' }],
    },
    ...this.menuGroups,
  ];
}
