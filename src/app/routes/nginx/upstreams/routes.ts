import { Routes } from '@angular/router';

import { UpstreamEditComponent } from './edit/upstream-edit.component';
import { UpstreamListComponent } from './list/upstream-list.component';

export const routes: Routes = [
  { path: '', component: UpstreamListComponent, data: { title: '上游服务' } },
  { path: 'create', component: UpstreamEditComponent, data: { title: '新增上游' } },
  { path: 'edit/:id', component: UpstreamEditComponent, data: { title: '编辑上游' } },
];
