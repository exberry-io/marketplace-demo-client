import { NgModule } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule } from '@angular/common/http';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';

import { BlockUIModule } from 'ng-block-ui';
import { AngularSplitModule } from 'angular-split';

import {
	MatSidenavModule,
	MatButtonModule,
	MatCheckboxModule,
	MatInputModule,
	MatGridListModule,
	MatIconModule,
	MatStepperModule,
	MatDatepickerModule,
	MatCardModule,
	MatListModule,
	MatToolbarModule,
	MatChipsModule,
	MatSelectModule,
	MatExpansionModule,
	MatSlideToggleModule,
	MatProgressSpinnerModule,
	MatDialogModule,
	MatMenuModule,
	MatSnackBarModule,
	MatRadioModule,
	MatAutocompleteModule,
	MatTabsModule,
	MatPaginatorModule,
	MatBottomSheetModule,
	MatBadgeModule,
	MatTableModule,
	MatSortModule,
	MatRippleModule,
	MatTooltipModule
} from '@angular/material';

import { ScrollDispatchModule } from '@angular/cdk/scrolling';



@NgModule({
	imports: [
		BrowserAnimationsModule,
		HttpClientModule,
		FormsModule,
		ReactiveFormsModule,

		BlockUIModule.forRoot(),
		AngularSplitModule.forRoot(),

		MatIconModule,
		MatButtonModule,
		MatCheckboxModule,
		MatInputModule,
		MatTabsModule,
		MatSortModule,
		MatSidenavModule,
		MatExpansionModule,
		MatSlideToggleModule,
		MatProgressSpinnerModule,
		MatDialogModule,
		MatSnackBarModule,
        MatBottomSheetModule,
		MatRippleModule,
		MatBadgeModule,
		MatTooltipModule,
		MatMenuModule,
		ScrollDispatchModule,
		MatTableModule
	],
	exports: [
		BrowserAnimationsModule,
		HttpClientModule,
		FormsModule,
		ReactiveFormsModule,

		BlockUIModule,
		AngularSplitModule,

		MatIconModule,
		MatButtonModule,
		MatCheckboxModule,
		MatInputModule,
		MatTabsModule,
		MatSortModule,
		MatSidenavModule,
		MatExpansionModule,
		MatSlideToggleModule,
		MatProgressSpinnerModule,
		MatDialogModule,
		MatSnackBarModule,
        MatBottomSheetModule,
		MatRippleModule,
		MatBadgeModule,
		MatMenuModule,
		MatTooltipModule,
		ScrollDispatchModule,
		MatTableModule
	],
})
export class CoreModule { }
