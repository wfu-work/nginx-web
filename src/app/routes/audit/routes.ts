import { Routes } from '@angular/router';

import { AuditListComponent } from './list/audit-list.component';

export const routes: Routes = [
  { path: '', component: AuditListComponent, data: { title: '审计记录' } },
];
