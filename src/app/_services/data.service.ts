import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment';

import { AppService } from '../app.service';

import * as _ from 'lodash';


@Injectable({
  providedIn: 'root'
})
export class DataService {

	appConfig = environment.appConfig;
	user: any = {};
	meta: any = {};

	appHttpOptions = {
		headers: new HttpHeaders({ 'Content-Type': 'application/json', 'Authorization': '' }),
	};

	constructor(
		private httpClient: HttpClient,
		public appService: AppService
	) {
	}

	//-------------------------------------------------------------->
	//api
	//-------------------------------------------------------------->

	public restoreSignIn(credentials?) {
		return this.getSimulated('account').then(response => {
			this.user = response;
			return this.user;
		});
	}

	metaSimulated: boolean = false;
	public getMetaData() {
		let that = this;
		if (this.metaSimulated) return this.getSimulated('metaData').then(preparMetaData);
		else {
			return this.getClean('https://sanity.demo.exberry.io/ui-demo/marketplace-metaData.json').then(res => { return preparMetaData([{ value: res }]) });
		}

		function preparMetaData(response) {
			let meta = that.meta = _.get(response, '[0].value');

			that.user = meta.user;
			if (!that.user.balance) that.user.balance = 150000;

			_.each(meta.topics, topic => {
				topic.brand.buttonText = _.get(topic, 'brand.buttonText', 'Invest');
				let foreColor = _.get(topic, 'brand.foreColor', 'rgb(242,189,53)');
				topic.brand.foreStyle = { color: foreColor }
				let backColor = _.get(topic, 'brand.backColor', 'rgb(242,189,53,0.6)');
				topic.brand.backStyle = { 'background-color': backColor }
				let actionColor = _.get(topic, 'brand.actionColor');
				if (actionColor) {
					topic.brand.actionStyle = { color: 'actionColor', 'background-color': foreColor }
				} else {
					topic.brand.actionStyle = { color: '#fff', 'background-color': '#000' }
				}

				_.each(topic.instruments, (instrument, index: number) => {
					instrument.decimals = instrument.decimalPrecision || 2;
					instrument.rounding = instrument.rounding || "down";
					instrument.imageURL = _.get(instrument, 'images[0]', null);
				});
			});



			
			return response;
		}

	}


	//-------------------------------------------------------------->
	//utils
	//-------------------------------------------------------------->

	public handleHttpError(error: any) {

		if (error && error.url && error.url.indexOf("sso/login") > -1) {
			// user logged out refresh
			window.location.reload();
			return;
		}
		// more cases to handle
		console.error(error);
		return error
	}

	public post(url, payload?, headers?): Promise<any> {
		return this.postClean(this.appConfig.endPoint + url, payload, headers);
	}
	public postClean(url, payload?, headers?): Promise<any> {
		return new Promise((resolve, reject) => {
			this.httpClient.post(url, payload || {}, headers || {})
				.subscribe(
					(results: any) => {
						resolve(results);
					},
					(err) => {
						this.handleHttpError(err);
						reject(err);
					}
				);
		});
	}
	public getClean(url, payload?): Promise<any> {
		return new Promise((resolve, reject) => {
			this.httpClient.get(url, payload)
				.subscribe(
					(results: any) => {
						resolve(results);
					},
					(err) => {
						this.handleHttpError(err);
						reject(err);
					}
				);
		});
	}


	public put(url, payload?, headers?): Promise<any> {
		return new Promise((resolve, reject) => {
			this.httpClient.put(this.appConfig.endPoint + url, payload || {}, headers || {})
				.subscribe(
					(results: any) => {
						resolve(results);
					},
					(err) => {
						this.handleHttpError(err);
						reject(err);
					}
				);
		});
	}

	public get(url, payload?): Promise<any> {
		let that = this;
		return new Promise((resolve, reject) => {
			this.httpClient.get(this.appConfig.endPoint + url, { params: payload })
				.subscribe(
					(results: any) => {
						resolve(results);
					},
					(err) => {
						this.handleHttpError(err);
						reject(err)
					}
				);
		});
	}

	public remove(url, payload?, headers?): Promise<any> {
		return new Promise((resolve, reject) => {

			this.httpClient.delete(this.appConfig.endPoint + url, { params: payload })
				.subscribe(
					(results: any) => {
						resolve(results);
					},
					(err) => {
						this.handleHttpError(err);
						reject(err);
					}
				);
		});
	}

	public getSimulated(what, args?): Promise<any> {
		let sURL = "assets/mock/";
		let resolved = null;
		let delay = 300;

		switch (what) {
			case "general":
				delay = 1000;
				sURL += "any.json"; break;
			case "account": sURL += "account.json"; break;
			case "metaData": sURL += "metaData_new.json"; break;
			default: sURL += "any.json"; break;
		}

		let that = this;
		return new Promise((resolve, reject) => {
			this.httpClient.get(sURL)
				.subscribe(
					(results: any) => {
						window.setTimeout(function () {
							resolve(resolved || results);
						}, delay);
					},
					(err) => {
						reject(err)
					}
				);
		});
	}


}
