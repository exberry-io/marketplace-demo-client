import { Pipe, PipeTransform } from '@angular/core';
import { DecimalPipe, PercentPipe } from '@angular/common';
import { CurrencyPipe } from '@angular/common';
import { AppService } from '../app.service';
import { BidService } from '../_services/bid.service';

import { DomSanitizer } from '@angular/platform-browser';
import * as _ from 'lodash';

@Pipe({ name: 'safeHtml' })
export class SafeHTMLPipe {
	constructor(private sanitizer: DomSanitizer) { }

	transform(val: string) {
		return this.sanitizer.bypassSecurityTrustHtml(val);
	}
}

@Pipe({ name: 'safeStyle' })
export class SafeStylePipe {
	constructor(private sanitizer: DomSanitizer) { }

	transform(val: string) {
		return this.sanitizer.bypassSecurityTrustStyle(val);
	}
}

@Pipe({ name: 'safeURL' })
export class SafeURLPipe {
	constructor(private sanitizer: DomSanitizer) { }

	transform(val: string) {
		return this.sanitizer.bypassSecurityTrustResourceUrl(val);
	}
}

@Pipe({
	name: 'moneyPipe',
})
export class MoneyPipe implements PipeTransform {
	constructor(
		private appService: AppService
	) { }

	transform(val: string, digitsInfo?: string) {
		return (new CurrencyPipe('he')).transform(val, null, this.appService.currency, digitsInfo);
	}
}

@Pipe({
	name: 'iDecimal',
})
export class InstrumentDecimalPipe {
	constructor(
		private exchangeService: BidService
	) { }

	transform(val: any, type?: string, decimals=2) {
		if (!val) return "--";
		if (type == 'q') return (new DecimalPipe('en')).transform(val, '1.0-2');
		return (new DecimalPipe('en')).transform(val, `1.${decimals}-${decimals}`);
	}
}


@Pipe({
	name: 'translate',
	pure: false
})
export class TranslatePipe implements PipeTransform {
	constructor(private appService: AppService) {}
	transform(value: any, options?: any): any {
		let ret = this.appService.translate(value, options);
		return ret || value;
	}
}

@Pipe({
	name: 'mapEnt',
	pure: false
})
export class MapEntPipe implements PipeTransform {
	constructor(private appService: AppService) { }
	transform(value: any, list: any, idField = 'id', captionField = 'name', _default=''): any {
		return this.appService.getEnumCaptionById(value, list, idField, captionField, _default)
	}
}

@Pipe({
	name: 'phone'
})
export class PhonePipe {
	transform(tel, args) {
		var value = tel.toString().trim().replace(/^\+/, '');
		if (value.match(/[^0-9]/)) {
			return tel;
		}
		var country, city, number;
		switch (value.length) {
			case 10: // +1PPP####### -> C (PPP) ###-####
				country = 1;
				city = value.slice(0, 3);
				number = value.slice(3);
				break;

			case 11: // +CPPP####### -> CCC (PP) ###-####
				country = value[0];
				city = value.slice(1, 4);
				number = value.slice(4);
				break;

			case 12: // +CCCPP####### -> CCC (PP) ###-####
				country = value.slice(0, 3);
				city = value.slice(3, 5);
				number = value.slice(5);
				break;

			default:
				return tel;
		}
		if (country == 1) {country = "";}
		number = number.slice(0, 3) + '-' + number.slice(3);
		return (country + " (" + city + ") " + number).trim();
	}
}

@Pipe({
	name: 'highlight'
})
export class HighlightPipe implements PipeTransform {
	constructor(private sanitizer: DomSanitizer) { }

	transform(value: any, args: any): any {
		if (!args || args == '') {
			return value;
		}
		const re = new RegExp(args, 'gi');
		const match = value.match(re);

		if (!match) {return value;}

		const replacedValue = value.replace(re, "<mark>" + match[0] + "</mark>")
		return this.sanitizer.bypassSecurityTrustHtml(replacedValue)
	}
}

@Pipe({ name: 'reverseOrder' })

export class ReverseOrderPipe implements PipeTransform {
	transform(value) {
		return value.slice().reverse();
	}
}

@Pipe({
	name: 'filterBy',
	pure: false
})
//https://github.com/VadimDez/ngx-filter-pipe

export class FilterPipe implements PipeTransform {

	static isFoundOnWalking(value, key) {
		let walker = value;
		let found = false;
		do {
			if (walker.hasOwnProperty(key) || Object.getOwnPropertyDescriptor(walker, key)) {
				found = true;
				break;
			}
		} while (walker = Object.getPrototypeOf(walker));

		return found;
	}

	static isNumber(value) {
		return !isNaN(parseInt(value, 10)) && isFinite(value);
	}

	/**
	 * Checks function's value if type is function otherwise same value
	 */
	static getValue(value: any): any {
		return typeof value === 'function' ? value() : value;
	}

	private filterByString(filter) {
		if (filter) {
			filter = filter.toLowerCase();
		}
		return value => !filter || (value ? ('' + value).toLowerCase().indexOf(filter) !== -1 : false);
	}

	private filterByBoolean(filter) {
		return value => Boolean(value) === filter;
	}

	private filterByObject(filter) {
		return value => {
			for (const key in filter) {

				if (key === '$or') {
					if (!this.filterByOr(filter.$or)(FilterPipe.getValue(value))) {
						return false;
					}
					continue;
				}

				if (!FilterPipe.isFoundOnWalking(value, key)) {
					return false;
				}

				if (!this.isMatching(filter[key], FilterPipe.getValue(value[key]))) {
					return false;
				}
			}

			return true;
		};
	}

	private isMatching(filter, val) {
		switch (typeof filter) {
			case 'boolean':
				return this.filterByBoolean(filter)(val);
			case 'string':
				return this.filterByString(filter)(val);
			case 'object':
				return this.filterByObject(filter)(val);
		}
		return this.filterDefault(filter)(val);
	}

	/**
	 * Filter value by $or
	 */
	private filterByOr(filter: any[]): (value: any) => boolean {
		return (value: any) => {
			const length = filter.length;

			const arrayComparison = (i) => value.indexOf(filter[i]) !== -1;
			const otherComparison = (i) => value === filter[i];
			const comparison = Array.isArray(value) ? arrayComparison : otherComparison;

			for (let i = 0; i < length; i++) {
				if (comparison(i)) {
					return true;
				}
			}

			return false;
		};
	}

	/**
	 * Default filterDefault function
	 */
	private filterDefault(filter: any): (value: any) => boolean {
		return (value: any) => filter === undefined || filter == value;
	}

	transform(array: any[], filter: any): any {
		if (!array) {
			return array;
		}

		switch (typeof filter) {
			case 'boolean':
				return array.filter(this.filterByBoolean(filter));
			case 'string':
				if (FilterPipe.isNumber(filter)) {
					return array.filter(this.filterDefault(filter));
				}
				return array.filter(this.filterByString(filter));
			case 'object':
				return array.filter(this.filterByObject(filter));
			case 'function':
				return array.filter(filter);
		}
		return array.filter(this.filterDefault(filter));
	}
}
