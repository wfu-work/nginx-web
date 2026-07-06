import { Routes } from '@angular/router';
import { startPageGuard } from '@core';

import { LayoutBasic } from '../layout';
import { GuideComponent } from './guide/guide.component';

export const routes: Routes = [
  {
    path: '',
    component: LayoutBasic,
    canActivate: [startPageGuard],
    data: { title: 'Nginx 控制台' },
    children: [
      { path: '', redirectTo: 'nginx/dashboard', pathMatch: 'full' },
      { path: 'guide', component: GuideComponent, data: { title: '使用指南' } },
      {
        path: 'nginx',
        loadChildren: () => import('./nginx/routes').then((m) => m.routes),
        data: { title: 'Nginx 管理' },
      },
      {
        path: 'configs',
        loadChildren: () => import('./configs/routes').then((m) => m.routes),
        data: { title: '配置发布' },
      },
      {
        path: 'audit',
        loadChildren: () => import('./audit/routes').then((m) => m.routes),
        data: { title: '审计记录' },
      },
      {
        path: 'system',
        loadChildren: () => import('./system/routes').then((m) => m.routes),
        data: { title: '系统' },
      },
    ],
  },
  { path: '', loadChildren: () => import('./passport/routes').then((m) => m.routes) },
  {
    path: 'exception',
    loadChildren: () => import('./exception/routes').then((m) => m.routes),
    data: { title: '异常页' },
  },
  { path: '**', redirectTo: 'exception/404' },
];
