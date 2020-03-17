import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { AuthGuardService as AuthGuard } from './_core/auth-guard.service';
import { BidMainComponent } from './bid-main/bid-main.component'



const routes: Routes = [
	{ path: '', redirectTo: 'bids', pathMatch: 'full', canActivate: [AuthGuard] },
	{ path: 'bids', component: BidMainComponent, data: {} },
];

@NgModule({
	imports: [RouterModule.forRoot(routes, { scrollPositionRestoration: 'enabled' })],
	exports: [RouterModule]
})
export class AppRoutingModule { }


