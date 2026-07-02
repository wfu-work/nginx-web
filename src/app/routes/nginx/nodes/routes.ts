import { Routes } from '@angular/router';

import { NodeEditComponent } from './edit/node-edit.component';
import { NodeListComponent } from './list/node-list.component';

export const routes: Routes = [
  { path: '', component: NodeListComponent, data: { title: '节点管理' } },
  { path: 'create', component: NodeEditComponent, data: { title: '新增节点' } },
  { path: 'edit/:id', component: NodeEditComponent, data: { title: '编辑节点' } },
];
