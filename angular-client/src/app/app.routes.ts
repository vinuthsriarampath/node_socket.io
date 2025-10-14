import { Routes } from '@angular/router';
import { Login } from './pages/login/login';
import { Register } from './pages/register/register';
import { Dashboard } from './pages/dashboard/dashboard';
import { authGuard } from './guards/auth/auth-guard';

export const routes: Routes = [
    {
        title: 'Login Page',
        path:'',
        component:Login
    },
    {
        title:'Registration Page',
        path:'register',
        component:Register
    },
    {
        title: 'Dashboard page',
        path:'dashboard',
        component:Dashboard,
        canActivate:[authGuard]
    }
];
