import { Routes } from '@angular/router';

import { CertificateEditComponent } from './edit/certificate-edit.component';
import { CertificateListComponent } from './list/certificate-list.component';

export const routes: Routes = [
  { path: '', component: CertificateListComponent, data: { title: '证书管理' } },
  { path: 'create', component: CertificateEditComponent, data: { title: '新增证书' } },
  { path: 'edit/:id', component: CertificateEditComponent, data: { title: '编辑证书' } },
];
