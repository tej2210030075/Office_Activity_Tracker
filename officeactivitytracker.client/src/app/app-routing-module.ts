import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { Login } from './login';
import { TaskAssignment } from './task-assignment';
import { AdminDashboard } from './admin-dashboard';
import { UserManagement } from './user-management';
import { DivisionManagement } from './division-management';
import { TaskManagement } from './task-management';
import { EmployeeDashboard } from './employee-dashboard';
import { HeadDashboard } from './head-dashboard';

const routes: Routes = [
  {
    path: '',
    component: Login
  },
  {
    path: 'admin',
    component: AdminDashboard
  },
  {
    path: 'admin/users',
    component: UserManagement
  },
  {
    path: 'admin/divisions',
    component: DivisionManagement
  },
  {
    path: 'admin/tasks',
    component: TaskManagement
  },
  {
    path: 'head-dashboard',
    component: HeadDashboard
  },
  {
    path: 'task-assignment',
    component: TaskAssignment
  },
  {
    path: 'employee-dashboard',
    component: EmployeeDashboard
  },
  {
    path: '**',
    redirectTo: ''
  }
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes)
  ],
  exports: [
    RouterModule
  ]
})
export class AppRoutingModule {}
