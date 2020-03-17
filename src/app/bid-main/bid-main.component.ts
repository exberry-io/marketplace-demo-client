import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { BlockUI, NgBlockUI } from 'ng-block-ui';

import { Router, ActivatedRoute } from '@angular/router';

import { AppService } from '../app.service';
import { DataService } from '../_services/data.service';
import { BidService } from '../_services/bid.service';

import * as _ from 'lodash';
declare const $: any;

@Component({
  selector: 'app-bid-main',
  templateUrl: './bid-main.component.html',
  styleUrls: ['./bid-main.component.scss']
})
export class BidMainComponent implements OnInit, OnDestroy {
	parametersObservable: any;
	mode: string;// = 'instruments';	

	loaded: boolean = false;
	loading: boolean = true;
	user: any;

	constructor(
		private route: ActivatedRoute,
		private router: Router,
		public appService: AppService,
		public dataService: DataService,
		public bidService: BidService
	) {
		//this.instrument = this.dataService.meta.currentInstrument;
	}

	ngOnDestroy() {
		this.bidService.instrument = null;
		this.bidService.instrumentInstanceId = null;
		this.bidService.stop();
	}

	
	ngOnInit() {
		this.parametersObservable = this.route.params.subscribe(params => {
			let topicId = this.route.snapshot.paramMap.get('topic') || this.dataService.meta.topics[0].id;
			let instrumentId = this.route.snapshot.paramMap.get('ins') || null;
			let mode = this.route.snapshot.paramMap.get('mode') || null;
			if (!this.loaded || topicId != this.bidService.topicId) this.init(topicId, instrumentId, mode);
			else this.selectInstrument(instrumentId, mode);
		});
	}

	init(topicId, instrumentId?, mode?) {
		this.appService.startBlock();
		this.loading = true;
		this.bidService.start(topicId).then(() => {
			this.appService.stopBlock();
			this.loaded = true;
			this.selectInstrument(instrumentId, mode);
		}).catch(err => {
			alert("Error Starting Service")
		}).then(() => {
			this.loading = false;
		})

		//this.bidService.toastr.success('Test Success Toaster', null, { disableTimeOut: true })
		//this.bidService.toastr.error('Test Error Toaster', null, { disableTimeOut: true })
	}

	goHome() {
		this.selectTopic(this.bidService.topicId);
	}

	selectTopic(topicId) {
		this.router.navigate(['/bids', { topic: topicId }]);
	}

	selectInstrument(instrumentId, mode?) {
		if (mode) {
			this.mode = mode;
			this.bidService.instrument = null;
			this.bidService.instrumentInstanceId = null;
		} else if (instrumentId) {
			let instrument = this.bidService.data[instrumentId];
			if (!instrument) {
				this.selectInstrument(null);
				return this.goHome();
			}
			if (instrument == this.bidService.instrument) return;
			if (this.mode == 'instrument') this.bidService.selectInstrument(instrument, true);
			else {
				this.bidService.selectInstrument(instrument, false);
				this.mode = 'instrument';
			}
		} else {
			this.bidService.instrument = null;
			this.bidService.instrumentInstanceId = null;
			this.mode = 'instruments';
		}
	}

	goToInstrument(instrument) {
		this.router.navigate(['/bids', { topic: this.bidService.topicId, ins: instrument.key }]);
	}
	goToInvestments() {
		this.router.navigate(['/bids', { topic: this.bidService.topicId, mode: 'investments' }]);
	}
	gotoExchange() {
		top.location.href = this.dataService.meta.exchangeURL;
	}

}
