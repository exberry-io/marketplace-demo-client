import { Component, OnInit } from '@angular/core';
import { trigger, state, style, animate, transition, query, stagger} from '@angular/animations';
import { Router, ActivatedRoute } from '@angular/router';
import { OwlOptions } from 'ngx-owl-carousel-o';

import { AppService } from '../../app.service';
import { DataService } from '../../_services/data.service';
import { BidService } from '../../_services/bid.service';

import * as _ from 'lodash';

@Component({
	selector: 'app-bid-instruments',
	templateUrl: './bid-instruments.component.html',
	styleUrls: ['./bid-instruments.component.scss'],
	animations: [
		trigger('cardAnimation', [
			transition(':enter', [
				style({ opacity: 0, transform: 'scale(0.7)' }),
				animate('0.3s 0s ease-in-out', style({ opacity: 1, transform: 'scale(1.05)' })),
				animate('0.2s 0s ease-in', style({ transform: 'scale(1)' }))
			]),
			transition(':leave', [
				style({ transform: 'scale(1)' }),
				animate('0.3s 0s ease-in-out', style({ opacity: 1, transform: 'scale(1.05)' })),
				animate('0.3s 0s ease-in', style({ opacity: 0, transform: 'scale(0.5)' })),
				animate('0.1s 0s ease-in', style({ width: 0 }))
			])
		]),
		trigger('flipinY', [
			transition(':enter', [
				style({ opacity: 0, transform: 'perspective(400px) rotate3d(0, 1, 0, 90deg)' }),
				animate('0.4s 0s ease-in', style({ opacity: 0.6, transform: 'perspective(400px) rotate3d(0, 1, 0, -20deg)' })),
				animate('0.1s 0s ease-in', style({ opacity: 1, transform: 'perspective(400px) rotate3d(0, 1, 0, 10deg)' })),
				animate('0.1s 0s ease-in', style({ transform: 'perspective(400px) rotate3d(0, 1, 0, -5deg)' })),
				animate('0.1s 0s ease-in', style({ transform: 'perspective(400px)' }))
			])
		]),
		trigger('fadeIn', [
			transition(':enter', [
				style({ opacity: 0}),
				animate('0.5s 0s ease-in', style({ opacity: 1 }))
			])
		]),
		trigger('listStagger', [
			transition('* <=> *', [
				query(
					':enter',
					[
						style({ opacity: 0, transform: 'scale(0.7)' }),
						stagger(
							'200ms',
							[
								animate('0.3s 0s ease-in-out', style({ opacity: 1, transform: 'scale(1.05)' })),
								animate('0.2s 0s ease-in', style({ transform: 'scale(1)' }))
							]
						)
					],
					{ optional: true }
				),
				query(':leave', animate('50ms', style({ opacity: 0 })), {
					optional: true
				})
			])
		])
	]
})
export class BidInstrumentsComponent implements OnInit {
	home: any;
	customOptions: OwlOptions = {
		loop: true,
		mouseDrag: false,
		touchDrag: false,
		pullDrag: false,
		dots: false,
		navSpeed: 700,
		navText: ['', ''],
		margin: 30,
		items: 3,
		
		responsive: {
			0: {
				items: 1

			},
			740: {
				items: 2
			},
			960: {
				items: 3
			}
		},
		nav: true
	}


	constructor(
		private route: ActivatedRoute,
		private router: Router,
		public appService: AppService,
		public dataService: DataService,
		public bidService: BidService
	) {
		this.home = this.bidService.topic.home;
	}

	ngOnInit() {
		this.instruments = this.bidService.instruments;
	}

	clearSearch() {
		this.searchTerm = '';
		this.instruments = this.bidService.instruments;
	}

	filterTimeout: any;
	searchTerm: string = '';
	instruments: any;
	filterInstruments(value: string) {
		if (this.filterTimeout) window.clearTimeout(this.filterTimeout);
		this.filterTimeout = window.setTimeout(() => {
			let _searchTerm = this.searchTerm.toLowerCase();
			if (_searchTerm.length < 2) this.instruments = this.bidService.instruments;
			else {
				this.instruments = _.filter(this.bidService.instruments, instrument => {
					if (instrument.name && instrument.name.toLowerCase().indexOf(_searchTerm) != -1) return true;
					if (instrument.description && instrument.description.toLowerCase().indexOf(_searchTerm) != -1) return true;
				});
				if (this.instruments.length) {
					while (this.instruments.length < 3) {
						this.instruments.push(null);
					}
				}
				

			}
			

			console.log(this.instruments.length)
		}, 300);
	}

	selectInstrument(instrument) {
		this.router.navigate(['/bids', { topic: this.bidService.topicId, ins: instrument.key }]);
	}

}
