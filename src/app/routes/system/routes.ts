import { Routes } from '@angular/router';

import { ProfileComponent } from './profile/profile.component';

export const routes: Routes = [
  { path: '', redirectTo: 'profile', pathMatch: 'full' },
  {
    path: 'profile',
    component: ProfileComponent,
    data: { title: '个人中心' },
  },
];
