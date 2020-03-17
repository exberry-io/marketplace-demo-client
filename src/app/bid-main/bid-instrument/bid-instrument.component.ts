import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { formatNumber } from '@angular/common';
import { trigger, state, stagger, style, animate, transition, query, animateChild } from '@angular/animations';

import { AppService } from '../../app.service';
import { DataService } from '../../_services/data.service';
import { BidService } from '../../_services/bid.service';

import * as Highcharts from 'highcharts';
import * as _ from 'lodash';


@Component({
	selector: 'app-bid-instrument',
	templateUrl: './bid-instrument.component.html',
	styleUrls: ['./bid-instrument.component.scss'],
	animations: [
		trigger('cardAnimation', [
			transition(':enter', [
				// 2019-09-28 - Unfortunately due to iOS 13 WKWebView bugs - we cannot use the width animation here (as it causes the whole "strip" of cards scroll to go "wacko"...)
				//style({ opacity: 0, width: 0, transform: 'scale(0.7)' }),
				//animate('0.2s 0s ease-in', style({ width: '280px' })),
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
				animate('0.1s 0s ease-in', style({ transform: 'perspective(400px)' })),
			])
		]),
		trigger('fadeIn', [
			transition(':enter', [
				style({ opacity: 0 }),
				animate('0.5s 0s ease-in', style({ opacity: 1 }))
			])
		]),
	]
})
export class BidInstrumentComponent implements OnInit, OnDestroy, AfterViewInit {	
	private instrumentChangedSubscription: Subscription = null;
	private executedOrdersChangedSubscription: Subscription = null;	

	instrument: any;
	imgStep: number = 0;
	loadingPO: boolean = false;

	constructor(
		public appService: AppService,
		public dataService: DataService,
		public bidService: BidService
	) {
		this.instrumentChangedSubscription = this.bidService.instrumentChanged$.subscribe(_instrument => {
			this.init(true);
		});
		this.init();
	}

	ngOnInit() { }

	ngAfterViewInit() {
		this.executedOrdersChangedSubscription = this.bidService.executedOrdersChanged$.subscribe((_row: any) => {
			if (_row.instrument == this.instrument.key) {
				this.updateChartData(_row);
			}
		})
	}

	ngOnDestroy() {
		this.instrumentChangedSubscription.unsubscribe();
		this.executedOrdersChangedSubscription.unsubscribe();
	}

	init(fromRoute?) {
		this.imgStep = 0;
		if (this.instrument == this.bidService.instrument) return;
		this.instrument = this.bidService.instrument;
		this.generateChartData();
		if (fromRoute) this.reloadPO();
	}

	//------------------------------------------------------------------------------------------------>
	// place order
	//------------------------------------------------------------------------------------------------>

	newOrder: any = {
		"orderType": "Limit",
		"isClosePositionOrder": true,
		"quantity": 1
	}
	placingOrder: boolean = false;
	placeOrder(side, form) {
		if (form.valid) {
			this.placingOrder = true;
			let order = this.newOrder;
			order.side = side;

			this.bidService.placeOrder(this.newOrder).then(response => {
				this.placingOrder = false;
				let price = order.orderType == 'Market' ? 'Market Price' : formatNumber(order.price, 'en', '1.2-2')
				this.bidService.addInfoStack({ 'message': `Order Accepted: ${side} ${formatNumber(order.quantity, 'en', '1.2-2')} Contracts of ${this.bidService.instrument.name} at ${price}.` });
			}).catch(err => {
				this.placingOrder = false;
			});
		} else {
			_.each(form.controls, obj => {
				obj.markAsDirty();
			});
		}
	}
	reloadPO() {
		this.loadingPO = true;
		setTimeout(() => {
			this.loadingPO = false;
		}, 1);
	}

	//------------------------------------------------------------------------------------------------>
	// carousel
	//------------------------------------------------------------------------------------------------>

	moveSlider(newPos) {
		let n = _.get(this.instrument, 'images.length', 0);
		if (!n) return;
		if (newPos < 0) newPos = n - 1;
		else if (newPos >= n) newPos = 0;
		this.imgStep = newPos;
	}

	//------------------------------------------------------------------------------------------------>
	// order book
	//------------------------------------------------------------------------------------------------>

	injectOrder(row) {
		_.assignIn(this.newOrder, { orderType: "Limit", price: row.price, quantity: Math.abs(row.quantity) });
		this.reloadPO();
	}

	//------------------------------------------------------------------------------------------------>
	// chart
	//------------------------------------------------------------------------------------------------>

	wasChartDataGenerated: boolean = false;
	chartData: any = [];
	chartInstance: Highcharts.Chart;
	updateTimeout: any;

	logChartInstance(chart: Highcharts.Chart) {
		this.chartInstance = chart;
		if (this.wasChartDataGenerated) this.setChartData();
	}



	generateChartData() {
		let arr = [];
		let reff = _.orderBy(this.instrument.executedOrders, ['eventTimestamp'], ['asc']);
		_.each(reff, (order, index) => {
			arr.push([order.eventTimestamp, order.executedPrice]);
		});
		this.chartData = arr;
		if (this.chartInstance) this.setChartData();
		else this.wasChartDataGenerated = true;
	}

	setChartData() {
		this.chartInstance.update({
			series: [{
				name: 'Price',
				data: this.chartData,
				type: 'area',
				color: this.appService.$brand.backColor,
				marker: {
					radius: 2,
					enabled: undefined
				}
			}]
		})
		//this.chartInstance.series[0].setData(this.chartData);
		//this.chartInstance.reflow(); // set chart height
	}

	
	updateChartData(line) {
		clearTimeout(this.updateTimeout);
		if (!this.wasChartDataGenerated) return;
		
		this.updateTimeout = setTimeout(() => {
			this.generateChartData();
		}, 200);
	}	

	Highcharts: typeof Highcharts = Highcharts;
	chartOptions: Highcharts.Options = {
		title: {
			text: undefined
		},
		chart: {
			zoomType: 'x',
			panKey: 'alt',
			panning: {
				enabled: true,
			}
			//height:'100%'
		},
		legend: {
			enabled: false
		},
		yAxis: {
			floor: 0,
			title: {
				text: undefined
			}
		},
		xAxis: {
			type: 'datetime'
		},
		plotOptions: {
			area: {
				marker: {
					radius: 2
				},
				lineWidth: 1,
				states: {
					hover: {
						lineWidth: 1
					}
				},
				threshold: null
			}
		},

		series: [{
			name: 'Price',
			data: [],
			type: 'area',
			color: this.appService.$brand.backColor,
			marker: {
				radius:2,
				enabled: undefined
			}
		}]
	};


	

}
