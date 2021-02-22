import { Component, OnInit, OnDestroy, AfterViewInit, ViewChild } from '@angular/core';
import { Subscription } from 'rxjs';
import { trigger, state, style, animate, transition, query, stagger } from '@angular/animations';
import { Router, ActivatedRoute } from '@angular/router';
import { MatTable } from '@angular/material';

import { AppService } from '../../app.service';
import { DataService } from '../../_services/data.service';
import { BidService } from '../../_services/bid.service';

import * as _ from 'lodash';

@Component({
  selector: 'app-bid-investments',
  templateUrl: './bid-investments.component.html',
	styleUrls: ['./bid-investments.component.scss'],
	animations: [
		trigger('fadeIn', [
			transition(':enter', [
				style({ opacity: 0 }),
				animate('0.5s 0s ease-in', style({ opacity: 1 }))
			])
		]),
	]
})
export class BidInvestmentsComponent implements OnInit, OnDestroy, AfterViewInit {
	options: any = {};
	@ViewChild('exchangeTable', { static: false }) exchangeTable: MatTable<Element>;

	private activeOrdersSubscription: Subscription = null;
	activeOrders = [];
	activeOrdersSort: any = {
		"active": "orderId",
		"direction": "desc"
	}

	private executedOrdersSubscription: Subscription = null;
	executedOrders = [];
	executedOrdersSort: any = {
		"active": "_orderId",
		"direction": "desc"
	}

	tables: any = [
		{ id: "activeOrders", name: "Active Orders", displayedColumns: ['image', 'instrument', 'side', 'quantity', 'price', 'orderId', 'mpId', 'spacer'] },
		{ id: "executedOrders", name: "Executed Orders", displayedColumns: ['image', 'instrument', '_side', 'executedQuantity', 'executedPrice', '_orderId', '_mpId', 'eventTimestamp'] },
	];
	tablesMap: any;
	selectedTable: any = this.tables[0];

	defaultSelectedRow;
	defaultColoms = ['data'];


	constructor(
		private route: ActivatedRoute,
		private router: Router,
		public appService: AppService,
		public dataService: DataService,
		public bidService: BidService
	) {
		this.tablesMap = _.keyBy(this.tables, 'id');
		if (!this.selectedTable) this.selectedTable = this.tables[0];
	}

	ngOnInit() {
		this.getActiveOrders();
		this.activeOrdersSubscription = this.bidService.activeOrdersChanged$.subscribe(() => {
			this.getActiveOrders();
			if (this.selectedTable.id == 'activeOrders') this.exchangeTable.renderRows();
		});

		this.getExecutedOrders();
		this.executedOrdersSubscription = this.bidService.executedOrdersChanged$.subscribe(() => {
			this.getExecutedOrders();
			if (this.selectedTable.id == 'executedOrders') this.exchangeTable.renderRows();
		});
	}

	ngAfterViewInit() {

	}

	ngOnDestroy() {
		this.executedOrdersSubscription.unsubscribe();
		this.activeOrdersSubscription.unsubscribe();
	}

	getActiveOrders() {
		let arr = [];
		let userId = this.dataService.user.mpId;
		_.each(this.bidService.instruments, instrument => {
			let orders = _.filter(instrument.activeOrders, order => order.mpId == userId);
			arr = arr.concat(orders);
		});
		this.activeOrders = arr;
		this.sortActiveOrders();
		return arr;
	}
	getExecutedOrders() {
		let arr = [];
		_.each(this.bidService.instruments, instrument => {
			let orders = _.filter(instrument.executedOrders, order => order._ex);
			let userId = this.dataService.user.mpId;
			_.each(instrument.executedOrders, message => {
				let _message = message;
				if (message.makerMpId == userId || message.takerMpId == userId) {
					
					let addMessage = _.find(instrument.messages, { orderId: message.makerOrderId });
					if (message.makerMpId == userId) {
						if (message.takerMpId == userId) {
							_message = _.cloneDeep(message);
						}
						message._side = addMessage && addMessage.side;
						message._orderId = message.makerOrderId;
						message._mpId = message.makerMpId;
						arr.push(message);
					}
					if (message.takerMpId == userId) { 
						_message._side = addMessage && addMessage.side == 'Buy' ? 'Sell' : 'Buy';
						_message._orderId = _message.takerOrderId;
						_message._mpId = _message.takerMpId;
						arr.push(_message);
					}
					
				}
			})

			//arr = arr.concat(orders);
		});
		this.executedOrders = arr;
		this.sortExecutedOrders();
		return arr;
	}

	selectTable(tab) {
		this.selectedTable = tab;
	}

	cancelOrder(order) {
		if (order.closing) return;
		order.closing = true;

		this.bidService.cancelOrder(order).then(response => {
			order.closing = false;
		}).catch(err => {
			order.closing = false;
		});
	}

	sortActiveOrders(sortData?, render?) {
		if (sortData) this.activeOrdersSort = sortData;
		this.activeOrders = _.orderBy(this.activeOrders, [this.activeOrdersSort.active], [this.activeOrdersSort.direction]);
		if (render) this.exchangeTable.renderRows();
	}

	sortExecutedOrders(sortData?, render?) {
		//'takerOrderId', 'makerOrderId'
		if (sortData) this.executedOrdersSort = sortData;
		this.executedOrders = _.orderBy(this.executedOrders, [this.executedOrdersSort.active], [this.executedOrdersSort.direction]);
		if (render) this.exchangeTable.renderRows();
	}

	selectInstrument(instrumentId) {
		this.router.navigate(['/bids', { topic: this.bidService.topicId, ins: instrumentId }]);
	}

}
