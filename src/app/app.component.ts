import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { BlockUI, NgBlockUI } from 'ng-block-ui';

import { AppService } from './app.service';
import { DataService } from './_services/data.service';

import * as _ from 'lodash';

@Component({
	selector: 'app-root',
	templateUrl: './app.component.html',
	styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
	title = 'sochnut-plans-dash';
	@BlockUI() blockUI: NgBlockUI;
	loading: boolean = true;

	constructor(
		private router: Router,
		public appService: AppService,
		private dataService: DataService
	) {

	}

	ngOnInit() {
		this.appService.blockUI = this.blockUI;
		let that = this;
		// Check Session
		this.dataService.restoreSignIn().then(response => {
			this.dataService.getMetaData().then(response => {
				that.loading = false;
			}).catch(err => {
				this.appService.alert({ content: "Error loading meta data!" }).then(o => {
					document.location.reload();
				})
			});

			//that.router.navigate(['/hub']);
		})
	}
}
