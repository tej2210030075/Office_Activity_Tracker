import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

import { App } from './app';
import { Login } from './login';
import { AdminDashboard } from './admin-dashboard';
import { UserManagement } from './user-management';
import { DivisionManagement } from './division-management';
import { TaskManagement } from './task-management';
import { EmployeeDashboard } from './employee-dashboard';
import { HeadDashboard } from './head-dashboard';
import { TaskAssignment } from './task-assignment';

import { AppRoutingModule } from './app-routing-module';

@NgModule({
  declarations: [
    App,
    Login,
    AdminDashboard,
    UserManagement,
    DivisionManagement,
    TaskManagement,
    EmployeeDashboard,
    HeadDashboard
  ],

  imports: [
    BrowserModule,
    CommonModule,
    FormsModule,
    HttpClientModule,
    AppRoutingModule,
    TaskAssignment
  ],

  providers: [],

  bootstrap: [App]
})
export class AppModule {}
