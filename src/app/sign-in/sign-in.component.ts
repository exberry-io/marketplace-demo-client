import { Component, OnInit, AfterViewInit, ChangeDetectorRef, NgZone } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';


import { AppService } from '../app.service';
import { DataService } from '../_services/data.service';

import * as _ from 'lodash';

@Component({
  selector: 'app-sign-in',
  templateUrl: './sign-in.component.html',
  styleUrls: ['./sign-in.component.scss']
})
export class SignInComponent implements OnInit {

	formModel = { name: '', password: '' };
	hidePassword: boolean = true;

	constructor(
		private router: Router,
		private route: ActivatedRoute,
		public appService: AppService,
		public dataService: DataService
	) { }

	ngOnInit() {
		if (this.appService.appConfig.idDev) {
			this.formModel = { name: 'Ori Schreiber', password: '01d610a1'}
		}
		localStorage.removeItem("user")
	}

	_redirect() {
		return this.dataService.getMetaData().then(response => {
			this.router.navigate(['/bids']);
		}).catch(err => {
			return;
		})
	}

	_signIn(form) {
		if (!form.valid) return;
		this.appService.blockUI.start();
		return this.dataService.signIn(this.formModel).then((response: any) => {
			return this._redirect();
		}).catch(err => {
			let message = _.get(err, 'message', 'Sign in error!');
			this.appService.alert({
				title: this.appService.translate('error_title'),
				content: message
			})
		}).then(res => {
			this.appService.blockUI.stop();
		});
	}


}
