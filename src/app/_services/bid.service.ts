import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { ToastrService } from 'ngx-toastr';

import { AppService } from '../app.service';
import { DataService } from './data.service';

import * as crypto from 'crypto-js';
import * as _ from 'lodash';


@Injectable({
	providedIn: 'root'
})
export class BidService {
	WS: WebSocket;

	logSentRequests: boolean = false;
	logReceivedMessages: boolean = false;
	logReconnections: boolean = true;
	logErrors: boolean = true;

	topicId;
	topic;

	user: any;
	userId: any;

	instrument: any = {};
	instrumentInstanceId: string;

	started: boolean = false;
	starting: boolean = false;

	callbacks: any = {};
	instruments: any;
	data: any = {};
	currentCallbackId: number = 0;

	private instrumentChangedSource = new Subject<any>();
	public instrumentChanged$ = this.instrumentChangedSource.asObservable();

	private marketRateChangedSource = new Subject<void>();
	public marketRateChanged$ = this.marketRateChangedSource.asObservable();

	private orderBookChangedSource = new Subject<void>();
	public orderBookChanged$ = this.orderBookChangedSource.asObservable();

	private activeOrdersChangedSource = new Subject<void>();
	public activeOrdersChanged$ = this.activeOrdersChangedSource.asObservable();
	activeOrdersSort:any = {
		"active": "orderId",
		"direction": "desc"
	}

	private executedOrdersChangedSource = new Subject<void>();
	public executedOrdersChanged$ = this.executedOrdersChangedSource.asObservable();
	executedOrders: any = [];
	executedOrdersSort: any = {
		"active": "takerOrderId",
		"direction": "desc"
	}

	private infoStackChangedSource = new Subject<void>();
	public infoStackChanged$ = this.infoStackChangedSource.asObservable();
	infoStack: any = [];
	
	constructor(
		public appService: AppService,
		public dataService: DataService,
		public toastr: ToastrService
	) {

	}

	public start(topicId) {
		let topic = _.find(this.dataService.meta.topics, { id: topicId });
		if (!topic) topic = this.dataService.meta.topics[0];
		this.topic = topic;
		this.topicId = topicId;
		this.appService.$brand = this.topic.brand;

		let user = this.dataService.user;
		if (user) {
			this.user = user;
			this.userId = user.userId;
		}
		
		this.resetStorage();
		this.started = false;
		this.starting = true;
		return this.initSocket();
	}

	public stop() {
		this.started = false;
		this.starting = false;
		this.resetStorage();
		if (this.WS) this.WS.close(1000);
	}

	private resetStorage() {
		this.callbacks = {};
		this.currentCallbackId = 10;
		let img = _.get(this.topic, 'home.image');
		if (img) this.loadImages([img]);

		this.instruments = _.cloneDeep(this.topic.instruments);
		_.each(this.instruments, instrument => {
			_.assignIn(instrument, {
				activeOrders: [],
				executedOrders: [],
				orderBook: []
			});
			if (instrument.marketRate) instrument.marketRate = 0;
			this.loadImages(instrument.images);
		});
		this.data = _.keyBy(this.instruments, 'key');
	}

	loadImages(args: any[]): void {
		setTimeout(() => {
			for (var i = 0; i < args.length; i++) {
				let img = new Image();
				img.src = args[i];
			}
		}, 0);
	}

	public selectInstrument(instrument, notify) {
		this.instrument = instrument;
		this.instrumentInstanceId = instrument.key;

		this.generateOrderBook(this.instrument);
		if (notify) this.instrumentChangedSource.next(this.instrument);
	}

	loading: boolean = false;
	private initSocket() {
		let that = this;
		this.loading = true;
		return new Promise((resolve, reject) => {
			setTimeout(() => {
				this.loading = false;
				resolve()
			}, 2000);

			_.each(this.callbacks, (callBack) => {
				try {
					if (callBack.callBack) callBack.callBack.reject();
				} catch (e) { }
			})
			this.callbacks = {};
			this.currentCallbackId = 10;
			if (this.WS) this.WS.close(1000);

			let wsURL = this.dataService.meta.wsEndPoint;
			this.WS = new WebSocket(wsURL);

			this.WS.onopen = (res) => {
				console.log('on open', res);
				this.started = true;
				that.startSession();
			}
			this.WS.onclose = (res) => {
				if (res.code == 1000) return;
				if (res.code == 1006) {
					this.log('Reconnect', res, 'warn');
					that.WS = null;
					that.initSocket();
				} else {
					this.log('Reconnect', res, 'error');
				}
			}
			this.WS.onerror = (res) => {
				this.log('WS Error', res, 'error');
			}
			this.WS.onmessage = (res) => {
				that.handleSocketResponse(res && JSON.parse(res.data));
			}
		});


	}

	private startSession() {
		let secret = this.dataService.meta.secret;
		let apiKey = this.dataService.meta.apiKey;
		let timeStamp = new Date().valueOf();
		let message = `"apiKey":"${apiKey}","timestamp":"${timeStamp}"`;
		let signature = crypto.HmacSHA256(message, secret).toString();

		this.sendRequest({
			"d": {
				"apiKey": apiKey,
				"timestamp": timeStamp,
				"signature": signature
			},
			"q": "exchange.market/createSession",
			"sid": 1
		});
	}

	private initRequests() {
		//marketRates
		this.sendRequest({
			"d": { "trackingNumber": 0 },
			"q": "exchange.market/orderBookDepth",
			"sid": 10
		});

	}

	public sendRequest(request, requsestType?, callBack?) {
		if (!request.sid) {
			let callbackId = ++this.currentCallbackId;
			request.sid = callbackId;
		}
		this.callbacks[request.sid] = {
			time: new Date(),
			type: requsestType,
			callBack: callBack
		};
		this.log('Sent Request', request);
		this.WS.send(JSON.stringify(request));
	}

	//---------------------------------------------------------------------------------------------->
	// 
	//---------------------------------------------------------------------------------------------->

	private handleSocketResponse(message) {
		if (!message) return;


		if (_.get(message.d, 'errorCode', null)) {
			this.handleMessageError(message);
			return;
		}

		this.log('Received Message', message);

		switch (message.q) {
			case 'exchange.market/createSession':
				if (message.sig == 1) this.initRequests();
				break;
			case 'exchange.market/orderBookDepth':
				this.processorderBookDepth(message.d)
				break;
			case 'exchange.market/placeOrder':
				if (message.sig == 1) {
					this.processPlacedOrder(message);
				}
				break;
			case 'exchange.market/cancelOrder':
				if (message.sig == 1) {
					this.addInfoStack({ message: 'Order Cancelled Successfully' });
					this.handleMessageCallBack(message);
				}
				break;
			//----------------------------------------------------------------------------------->

			case '/io.scalecube.services.error/500':

				break;
			default:
				if (message.d) {
					this.handleMessageCallBack(message);
				} else {

				}
		}
	}

	private handleMessageError(message) {
		this.log('Error', message, 'error');
		let messageText = _.get(message.d, 'errorMessage', 'Unknown Error');
		this.handleMessageCallBack(message, true);
		this.toastr.error(messageText, null, {  });
	}

	private handleMessageCallBack(message, isRejected?) {
		let qMeesage = this.callbacks[message.sid];
		if (qMeesage) {
			if (qMeesage.callBack) {
				if (isRejected) qMeesage.callBack.reject(message);
				else qMeesage.callBack.resolve(message);
			}
			this.callbacks[message.sid] = null;
		}
	}


	//---------------------------------------------------------------------------------------------->
	// PROCESS RESPONSE
	//---------------------------------------------------------------------------------------------->


	processorderBookDepth(message) {
		let bucket = this.data[message.instrument];
		if (!bucket) return;
		message.instrumentName = bucket.name;
		message.image = _.get(bucket, 'images[0]', '/assets/icons/info_circle.svg' );

		if (message.eventTimestamp) {
			//debugger;
			message.eventTimestamp = message.eventTimestamp / 1000000;
		}

		let activeOrders = bucket.activeOrders;
		let bookOrder;
		switch (message.messageType) {
			case "Add":
				message.filled = 0;
				message.initialQuantity = message.quantity;
				message.instrumentName = bucket.name;
				bookOrder = message;
				activeOrders.push(message);
				this.sortActiveOrders(bucket);
				break;
			case "Cancelled":
				let index = _.findIndex(activeOrders, { orderId: message.orderId });
				if (index != -1) {
					bookOrder = activeOrders[index];
					activeOrders.splice(index, 1);
				}
				break;
			case "Executed":
				let executedOrders = bucket.executedOrders;
				
				if (executedOrders.length > 200) {
					executedOrders.splice(200, 1);
				}
				executedOrders.push(message);

				this.sortExecutedOrders(bucket);
				this.executedOrdersChangedSource.next(message);
				this.processMarketRateEvent(bucket, { price: message.executedPrice });
				
				for (var _index = 0; _index < activeOrders.length; _index++) {
					bookOrder = activeOrders[_index];
					if (bookOrder.orderId == message.makerOrderId) {
						bookOrder.filled += message.executedQuantity;
						bookOrder.quantity -= message.executedQuantity;

						if (Math.abs(bookOrder.quantity * 1000000000000) < 0.01) { //due to rounding not chack ==0
							activeOrders.splice(_index, 1);
						}						
						break;
					}
				}
				break;
		}
		
		this.activeOrdersChangedSource.next(message);
		clearTimeout(bucket.$orderBookTimeout);
		bucket.$orderBookTimeout = setTimeout(() => {
			this.generateOrderBook(bucket, !this.loading && bookOrder);
		}, 50);
	}

	orderBookTimeout;
	orderBookLineId = 0;
	generateOrderBook(bucket, reffOrder?) {
		let that = this;
		let newBook = [];
		let highlightLine;
		_.each(bucket.activeOrders, order => {
			let line = that.updateOrderBookLine(newBook, order, order.quantity);
			if (reffOrder == order) highlightLine = line;
		});
		
		bucket.orderBook = _.orderBy(newBook, ['price'], ['asc']);

		let lowestPrice = _.find(bucket.orderBook, { side: 'Sell' });
		if (lowestPrice) bucket.lowestPrice = lowestPrice.price;
		else delete bucket.lowestPrice;

		this.fixOrderBookTotals(bucket.orderBook);

		this.orderBookChangedSource.next(highlightLine);
	}


	updateOrderBookLine(book, args, quantity) {
		let line = _.find(book, { side: args.side, price: args.price });
		if (!line) {
			line = {
				id: ++this.orderBookLineId,
				side: args.side,
				price: args.price,
				quantity: quantity,
				instrument: args.instrument
			}
			book.push(line);
		} else {
			line.quantity += quantity;
			if (line.quantity * 1000000000000 < 0.01) {
				let index = book.indexOf(line);
				book.splice(index, 1);
			}
		}
		return line;
	}

	fixOrderBookTotals(orderBook) {
		let buyTotal = 0;
		let selTotal = 0;

		var buyMax = 0, sellMax = 0;

		_.each(orderBook, order => {
			if (order.side == 'Buy') {
				buyTotal += order.quantity;
				buyMax = Math.max(buyMax, order.quantity);
			} else {
				selTotal += order.quantity;
				sellMax = Math.max(sellMax, order.quantity);
			}
		})
		_.each(orderBook, order => {
			if (order.side == 'Buy') {
				order.bar = order.quantity / buyTotal * 100;
				order.barQ = order.quantity / buyMax * 100;
			} else {
				order.bar = order.quantity / selTotal * 100;
				order.barQ = order.quantity / sellMax * 100;
			}
		});
	}

	private processMarketRateEvent(bucket, message) {
		let marketRate = !isNaN(message.price) ? _.round(message.price, 5) == 0 ? 0 : message.price : 0;
		if (marketRate === bucket.marketRate) return;

		if (!bucket.wasFirstChange) bucket.wasFirstChange = true;
		else if (!message.trendValue) {
			let instrumentRate = bucket.marketRate;
			let trendValue = ((marketRate / instrumentRate) - 1) * 100;
			bucket.trendValue = _.round(trendValue, 2);
		}
		bucket.marketRate = marketRate;
		this.marketRateChangedSource.next(bucket);
	}

	private processPlacedOrder(message) {
		let status = _.get(message, 'd.orderStatus');
		let isRejected = false;
		switch (status) {
			case "Rejected":
				isRejected = true;
				//this.appService.toastr('Order Rejected', { panelClass: 'error-snackbar', duration:3000});
				break;
			default:
				//if (status) this.appService.toastr('Order ' + status, { panelClass: 'success-snackbar', duration: 3000 });
				//else debugger;
				break;
		}
		this.handleMessageCallBack(message, isRejected);
	}

	sortActiveOrders(bucket, sortData?) {
		if (sortData) this.activeOrdersSort = sortData;
		bucket.activeOrders = _.orderBy(bucket.activeOrders, [this.activeOrdersSort.active], [this.activeOrdersSort.direction]);
	}

	sortExecutedOrders(bucket, sortData?) {
		//'takerOrderId', 'makerOrderId'
		if (sortData) this.executedOrdersSort = sortData;
		bucket.executedOrders = _.orderBy(bucket.executedOrders, [this.executedOrdersSort.active], [this.executedOrdersSort.direction]);
	}

	//---------------------------------------------------------------------------------------------->
	// ACTIONS
	//---------------------------------------------------------------------------------------------->

	brokerOrderIdCounter: number = new Date().valueOf();
	public placeOrder(_order) {
		let order = _.cloneDeep(_order);
		delete order.isClosePositionOrder;

		order.brokerOrderId = ++this.brokerOrderIdCounter
		let timeInforce = 'GTC'
		switch (order.orderType) {
			case "Market":
				timeInforce = 'IOC';
				delete order.price;
				break;
		}

		if (!order.userId) order.userId = this.userId;
		if (!order.instrument) order.instrument = this.instrumentInstanceId;
		if (!order.timeInForce) order.timeInForce = timeInforce;

		if (order.orderType == 'Limit' && order.timeInForce == 'GTD' && !order.expiryDate) {
			let mOffset = order.offsetMinutes || 5;
			order.expiryDate = Math.ceil((new Date().valueOf() / 1000)) + (mOffset * 60);
			console.log({
				utcDate: new Date().valueOf(),
				utcSeconds: Math.ceil((new Date().valueOf() / 1000)),
				utcSecondsPlusOffset: Math.ceil((new Date().valueOf() / 1000)) + (mOffset * 60)
			})
		}
		let request = {
			"q": "exchange.market/placeOrder", "d": order
		}

		return new Promise((resolve, reject) => {
			this.sendRequest(request, 'placeOrder', { resolve: resolve, reject: reject });
		});
	}


	public cancelOrder(order) {
		if (!order.userId) order.userId = this.userId;

		if (true) { //order.status != 'Cancelled' && order.remainingQuantity > 0
			let request = {
				"q": "exchange.market/cancelOrder", "d": {
					orderId: order.orderId,
					userId: order.userId,
					instrument: order.instrument
				}
			}
			return new Promise((resolve, reject) => {
				this.sendRequest(request, 'cancelOrder', { resolve: resolve, reject: reject });
			});
		}
	}

	//---------------------------------------------------------------------------------------------->
	// OLD
	//---------------------------------------------------------------------------------------------->

	public processUserOrderEvent(message) {
		if (message.instrumentInstanceId != this.instrumentInstanceId) return;

		let actionMap: any = {
			"Accepted": "Accepted",
			"Validated": "Validated",
			"New": "Submitted",
			"PartiallyFilled": "Partially Filled",
			"Filled": "Filled",
			"Cancelled": "Cancelled",
			"Rejected": "Rejected"
		}

		let tMessage = '';
		if (message.side == 'Buy') {
			tMessage = `Order ${actionMap[message.status]}: Buy ${message.quantity} Contracts of ${message.instrumentName} at ${message.price}.`;
		} else {
			tMessage = `Order ${actionMap[message.status]}: ${message.quantity} Contracts of ${message.instrumentName} sold at  ${message.price}.`;
		}

		switch (message.status) {
			case "Filled":
				tMessage += " The order was fully filled.";
				break;
			case "Cancelled":

				break;
			case "PartiallyFilled":
				if (message.side == 'Buy') {
					tMessage = `Order ${actionMap[message.status]}: Buy ${message.filledQuantity} Contracts of ${message.instrumentName} at ${message.price}.`;
				} else {
					tMessage = `Order ${actionMap[message.status]}: ${message.filledQuantity} Contracts of ${message.instrumentName} sold at  ${message.price}.`;
				}
				tMessage += ` ${message.remainingQuantity} contracts remain in the order.`
				break;
		}
		this.addInfoStack({ side: message.side, message: tMessage, timestamp: message.timestamp });

	}

	public addInfoStack(message) {
		this.infoStack.unshift(message);
		if (this.infoStack.length == 51) {
			this.infoStack.splice(-1, 1)
		}
		this.infoStackChangedSource.next(message);
		this.toastr.success(message.message, null, {  });
	}



	//---------------------------------------------------------------------------------------------->
	// ACTIONS
	//---------------------------------------------------------------------------------------------->

	private log(topic, data, type?) {
		if (!type) type = "log";
		switch (topic) {
			case "Sent Request": if (!this.logSentRequests) return; break;
			case "Received Message": if (!this.logReceivedMessages) return; break;
			case "Reconnect": if (!this.logReconnections) return; break;
			case "Error": if (!this.logErrors) return; break;
		}
		switch (type) {
			case "warn": console.warn(topic, data); break;
			case "error": console.error(topic, data); break;
			default: console.log(topic, data);
		}
	}




}
