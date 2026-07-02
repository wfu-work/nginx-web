import { Routes } from '@angular/router';

import { NginxConsoleComponent } from './nginx-console.component';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  {
    path: 'nodes',
    loadChildren: () => import('./nodes/routes').then((m) => m.routes),
    data: { title: '节点管理' },
  },
  {
    path: 'sites',
    loadChildren: () => import('./sites/routes').then((m) => m.routes),
    data: { title: '站点配置' },
  },
  {
    path: 'upstreams',
    loadChildren: () => import('./upstreams/routes').then((m) => m.routes),
    data: { title: '上游服务' },
  },
  {
    path: 'certificates',
    loadChildren: () => import('./certificates/routes').then((m) => m.routes),
    data: { title: '证书管理' },
  },
  {
    path: 'configs',
    redirectTo: '/configs',
    pathMatch: 'full',
  },
  {
    path: 'configs/:section',
    redirectTo: '/configs/:section',
  },
  { path: ':section', component: NginxConsoleComponent },
];
