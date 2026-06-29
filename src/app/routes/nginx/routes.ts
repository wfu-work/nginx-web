import { Routes } from '@angular/router';

import { NginxConsoleComponent } from './nginx-console.component';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: ':section', component: NginxConsoleComponent },
];
