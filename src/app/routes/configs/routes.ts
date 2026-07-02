import { Routes } from '@angular/router';

import { ConfigPreviewComponent } from './preview/config-preview.component';
import { ConfigPublishComponent } from './publish/config-publish.component';
import { ConfigTasksComponent } from './tasks/config-tasks.component';
import { ConfigVersionsComponent } from './versions/config-versions.component';

export const routes: Routes = [
  { path: '', redirectTo: 'preview', pathMatch: 'full' },
  { path: 'preview', component: ConfigPreviewComponent, data: { title: '配置预览' } },
  { path: 'publish', component: ConfigPublishComponent, data: { title: '校验发布' } },
  { path: 'versions', component: ConfigVersionsComponent, data: { title: '版本历史' } },
  { path: 'tasks', component: ConfigTasksComponent, data: { title: '发布任务' } },
];
