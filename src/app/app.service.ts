import { Injectable } from '@angular/core';
import { Location } from '@angular/common';
import { DomSanitizer } from '@angular/platform-browser';
import { Subject } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { Router, NavigationEnd } from '@angular/router';

import { MatIconRegistry, MatDialog, MatDialogRef, MAT_DIALOG_DATA, MatSnackBar } from '@angular/material';

import { NgBlockUI } from 'ng-block-ui';

import { environment } from '../environments/environment';
import { MessageDialogComponent } from './dialogs/message-dialog/message-dialog.component';
import { appStrings } from './_core/static/translations';

import * as _ from 'lodash';

declare const $: any;

import { fromEvent, interval } from 'rxjs';
import { debounce } from 'rxjs/operators';

@Injectable()
export class AppService {
	public blockUI: NgBlockUI;
	isProduction = environment.production;
	appConfig = environment.appConfig;
	cordovaPlatform: string = 'none';

	private previousUrl: string;
	private currentUrl: string;

	$brand: any = {
		
	}
	user = null;;

	images: any = {};
	icons: any = ['angle_down', 'angle_up', 'bars', 'check_circle', 'circle', 'filter', 'filter_full', 'home', 'square', 'check_square', 'thumbtack', 'thumbtack_full', 'info_circle', 'info_circle_full', 'arrow_up', 'arrow_down', 'expand-left', 'expand-right', 'location', 'times', 'caret-down', 'search', 'cubes', 'sign-out', 'user-circle', 'user-chart' ];
	currency: string = '₪';

	appLoaderConfig: any = {
		type: 'imageX',
		url: '/assets/exberry-logo-dark.svg',
		animation:'_rotate-z'
	}

	constructor(
		private http: HttpClient,
		public dialog: MatDialog,
		private _snackBar: MatSnackBar,
		private router: Router,
		private _location: Location,
		private sanitizer: DomSanitizer,
		private iconRegistry: MatIconRegistry
	) {
		//set images 
		let that = this;
		this.setLocale(this.appConfig.locale);

		this.currentUrl = this.router.url;
		router.events.subscribe(event => {
			if (event instanceof NavigationEnd) {
				this.previousUrl = this.currentUrl;
				this.currentUrl = event.url;
			};
		});
		_.each(this.icons, (ico) => {
			this.iconRegistry.addSvgIcon(`${ico}`, sanitizer.bypassSecurityTrustResourceUrl(this.base(`assets/icons/${ico}.svg`)));
		});

		const resize = fromEvent(window, 'resize');
		const resizeResult = resize.pipe(debounce(() => interval(300)));
		resizeResult.subscribe(ev => {
			this.checkMedia(true);
		});
		this.checkMedia();

	}

	//-------------------------------------------------------->
	// resize services
	//-------------------------------------------------------->

	public mediaChangedSource = new Subject<boolean>();
	public mediaChanged$ = this.mediaChangedSource.asObservable();
	isDesktop: boolean;

	checkMedia(publish?) {
		let w: number = window["innerWidth"], h: number = window["innerHeight"];
		let _isDesktop = w >= 1024;
		if (_isDesktop !== this.isDesktop) {
			this.isDesktop = _isDesktop;
			console.log('isDesktop', this.isDesktop);
			if (publish) this.mediaChangedSource.next(this.isDesktop)
		}
	}

	//-------------------------------------------------------->
	// messages
	//-------------------------------------------------------->

	locals: any[] = [
		{ id: "he-IL", transLang: "he-IL", dxM: "he", name: "עברית", short: "HE", direction: 'rtl' },
		{ id: "en-US", transLang: "en", dxM: "en", name: "English", short: "EN", direction: 'ltr' },
	]

	locale;
	selectedLocale;
	direction;
	backIcon: string;
	nextIcon: string;
	backAngleIcon: string;
	nextAngleIcon: string;
	translations: any = {}

	setLocale(locale) {
		if (this.locale == locale) return;
		this.locale = locale;

		if (this.selectedLocale && this.selectedLocale.bodyClass) $("body").removeClass(this.selectedLocale.bodyClass);

		let oLocal = this.locals.find(l => l.id == locale) || this.locals[0];
		this.selectedLocale = oLocal;
		this.direction = oLocal.direction;

		$("body, html").removeClass(this.direction == "rtl" ? "ltr" : "rtl").addClass(this.direction).prop("dir", this.direction);

		if (this.direction == "rtl") {
			this.backIcon = 'keyboard_arrow_right';
			this.nextIcon = 'keyboard_arrow_left';
			this.backAngleIcon = 'angle_right';
			this.nextAngleIcon = 'angle_left';
		} else {
			this.backIcon = 'keyboard_arrow_left';
			this.nextIcon = 'keyboard_arrow_right';
			this.backAngleIcon = 'angle_left';
			this.nextAngleIcon = 'angle_right';
		}

		this.translations = appStrings[this.locale] || {};
	}

	_translations:any = {}
	public translate(path: string, args?): string {
		if (!path) return "";
		const tokens = path.split('.');
		let translation = this.translations;
		for (let i = 0; i < tokens.length; i++) {
			translation = translation[tokens[i]];
			if (!translation) {
				this._translations[path] = path;
				return path;
			}
			if (args && i == tokens.length - 1) {
				_.each(args, (val, key) => {
					translation = translation.replace(`{{${key}}}`, val);
				});
			}
		}
		
		return translation;
	}

	logTranslations() {
		console.log(JSON.stringify(this._translations));
	}

	//-------------------------------------------------------->
	// messages
	//-------------------------------------------------------->

	public confirm(args?) {
		return this.messageDialog(_.assignIn({ mode: 'confirm' }, args));
	}
	public alert(args?) {
		return this.messageDialog(_.assignIn({ mode: 'alert', title: 'error_title', content: null }, args));
	}
	public prompt(args?) {
		return this.messageDialog(_.assignIn({ mode: 'prompt', width: "400px", title: 'please_enter_value', content: null, label: 'please_enter_value' }, args));
	}

	public messageDialog(args?) {
		let that = this;
		let base = _.assignIn({ mode: 'confirm', width: "300px", cancelText: 'Cancel', confirmText: 'OK', title: 'please_confirm', content: 'are_you_sure' }, args);
		return new Promise((resolve, reject) => {
			let dialogRef = this.dialog.open(MessageDialogComponent, {
				width: base.width,
				panelClass: 'rounded-dialog',
				data: base,
				autoFocus: false
			});
			dialogRef.afterClosed().subscribe(result => {
				if (result && result != "") {
					resolve(result);
				} else {
					reject(null);
				}
			});
		});
	}

	public toastr(message, args?) {
		let options = _.assignIn({ type: 'info', duration: 2000}, args);
		message = this.translate(message);
		
		switch (options.type) {
			case "success":
				this._snackBar.open(message, options.action, options);
				break;
			case "error":
				this._snackBar.open(message, options.action, options);
				break;
			case "warning":
				this._snackBar.open(message, options.action, options);
				break;
			default:
				this._snackBar.open(message, options.action, options);
		}
	}

	startBlock(args:any = {}) {
		if (args.class) $("body").addClass(args.class);
		if (args.text) args.text = this.translate(args.text);
		this.blockUI.start(args.text)
	}
	stopBlock(args: any = {}) {
		if (args.class) $("body").removeClass(args.class);
		this.blockUI.stop();
	}
	
	//-------------------------------------------------------->
	// utilities
	//-------------------------------------------------------->

	public goBack() {
		this._location.back();
	}

	public base(path: string): string {
		let host = this.appConfig.host;
		if (host == "") return path;
		this.appConfig.host = host.replace(/\/$/, '') + '/';
		path = path.replace(/^\//, '');
		return this.appConfig.host + path;
	}

	public scrollToTop(jelement?, delay = 300) {
		$(jelement).animate({ scrollTop: "0px" }, delay);
	}

	public imagesSrcCheck(src): Promise<boolean> {
		return new Promise(resolve => {
			let image = new Image();
			image.src = src;
			image.onload = () => resolve(true);
			image.onerror = () => resolve(false);
		})
	}

	public notImplemented() {
		this.alert({ content: "Not Implemented!" });
	}

	public getEnumCaptionById(id, _enum, idField = 'id', captionField = 'name', _default = '') {
		if (!_enum) return _default;
		let ret = _enum.find(c => c[idField] === id);
		return ret && ret[captionField] || _default;
	}

}
