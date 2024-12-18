import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { LoggedInGuard } from './guards/logged-in.guard';
import { AdminGuard } from './guards/admin.guard';

const routes: Routes = [
  {
    path: 'home',
    loadChildren: () => import('./pages/home/home.module').then( m => m.HomePageModule)
  },
  {
    path: 'login',
    loadChildren: () => import('./pages/login/login.module').then( m => m.LoginPageModule)
  },
  {
    path: 'signup',
    loadChildren: () => import('./pages/signup/signup.module').then( m => m.SignupPageModule)
  },  
  {
    path: 'cart',
    loadChildren: () => import('./pages/cart/cart.module').then( m => m.CartPageModule),
    canActivate: [LoggedInGuard]
  },
  {
    path: 'products/add',
    loadChildren: () => import('./pages/products/add/add.module').then( m => m.AddPageModule),
    canActivate: [AdminGuard]
  },
  {
    path: 'products/:id',
    loadChildren: () => import('./pages/products/info/info.module').then( m => m.InfoPageModule)
  },
  {
    path: 'products/edit/:id',
    loadChildren: () => import('./pages/products/edit/edit.module').then( m => m.EditPageModule),
    canActivate: [AdminGuard]
  },
  {
    path: 'order',
    loadChildren: () => import('./pages/order/order.module').then( m => m.OrderPageModule),
    canActivate: [LoggedInGuard]
  },
  {
    path: 'order/success',
    loadChildren: () => import('./pages/order/success/success.module').then( m => m.SuccessPageModule),
    canActivate: [LoggedInGuard]
  },
  {
    path: 'chat',
    loadChildren: () => import('./pages/chat/chat.module').then( m => m.ChatPageModule)
  },
  {
    path: 'payment/success',
    loadChildren: () => import('./payment/success/success.module').then( m => m.SuccessPageModule),
    canActivate: [LoggedInGuard]
  },
  {
    path: 'payment/cancel',
    loadChildren: () => import('./payment/cancel/cancel.module').then( m => m.CancelPageModule),
    canActivate: [LoggedInGuard]
  },
  {
    path: 'orders',
    loadChildren: () => import('./pages/orders/orders.module').then( m => m.OrdersPageModule),
    canActivate: [LoggedInGuard]
  },
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full'
  }
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
