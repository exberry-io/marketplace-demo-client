import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { DecimalPipe } from '@angular/common';

import { CoreModule } from './_core/core.module';

import { HighchartsChartModule } from 'highcharts-angular';
import { ToastrModule } from 'ngx-toastr';
import { CarouselModule } from 'ngx-owl-carousel-o';

import { AppRoutingModule } from './app-routing.module';
import { HttpInterceptorProviders } from './_core/refresh-token-interceptor';

import { HashLocationStrategy, LocationStrategy } from '@angular/common';

import { AppService } from './app.service';
import { AuthGuardService } from './_core/auth-guard.service';
import { DataService } from './_services/data.service';
import { BidService } from './_services/bid.service';

import { TranslatePipe, SafeHTMLPipe, SafeStylePipe, SafeURLPipe, ReverseOrderPipe, FilterPipe, MoneyPipe, InstrumentDecimalPipe, MapEntPipe, PhonePipe, HighlightPipe } from './_core/pipes';

import { AppComponent } from './app.component';
import { MessageDialogComponent } from './dialogs/message-dialog/message-dialog.component';
import { BidMainComponent } from './bid-main/bid-main.component';
import { BidInstrumentsComponent } from './bid-main/bid-instruments/bid-instruments.component';
import { BidInstrumentComponent } from './bid-main/bid-instrument/bid-instrument.component';
import { BidInvestmentsComponent } from './bid-main/bid-investments/bid-investments.component';
import { SignInComponent } from './sign-in/sign-in.component';


@NgModule({
	declarations: [
		TranslatePipe,
		SafeHTMLPipe,
		SafeStylePipe,
		SafeURLPipe,
		ReverseOrderPipe,
		FilterPipe,
		MoneyPipe,
		InstrumentDecimalPipe,
		MapEntPipe,
		PhonePipe,
		HighlightPipe,

		AppComponent,
		MessageDialogComponent,
		BidMainComponent,
		BidInstrumentsComponent,
		BidInstrumentComponent,
		BidInvestmentsComponent,
		SignInComponent,
	],
	imports: [
		BrowserModule,
		AppRoutingModule,
		CoreModule,
		HighchartsChartModule,
		ToastrModule.forRoot(),
		CarouselModule
	],
	providers: [
		{ provide: LocationStrategy, useClass: HashLocationStrategy },
		DecimalPipe,
		HttpInterceptorProviders,
		FilterPipe,
		AppService,
		AuthGuardService,
		DataService,
		BidService
	],
	entryComponents: [
		MessageDialogComponent,
	],
	bootstrap: [AppComponent]
})
export class AppModule { }
