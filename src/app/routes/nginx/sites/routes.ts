import { Routes } from '@angular/router';

import { SiteEditComponent } from './edit/site-edit.component';
import { SiteListComponent } from './list/site-list.component';

export const routes: Routes = [
  { path: '', component: SiteListComponent, data: { title: '站点配置' } },
  { path: 'create', component: SiteEditComponent, data: { title: '新增站点' } },
  { path: 'edit/:id', component: SiteEditComponent, data: { title: '编辑站点' } },
];
