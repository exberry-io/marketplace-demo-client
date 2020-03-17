import { Injectable, Injector } from "@angular/core";
import { HTTP_INTERCEPTORS, HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from "@angular/common/http";
import { throwError, Observable, BehaviorSubject } from 'rxjs';
import { take, filter, catchError, switchMap, finalize } from 'rxjs/operators';


@Injectable()
export class RefreshTokenInterceptor implements HttpInterceptor {
    
    refreshTokenInProgress:boolean = false;
    tokenSubject: BehaviorSubject<string> = new BehaviorSubject<string>(null);
    
    constructor(
		
    ) { }
    
    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<any> {
        return next.handle(req).pipe(
            catchError(err => {
                if (err instanceof HttpErrorResponse) {
                    if (err.status === 400) {
						return throwError(err);
                    } else if (err.status === 403) {
						return throwError(err);
                    } else if (err.status === 401) {
						return throwError(err);
                    } else {
                        return throwError(err);
                    }
                } else {
                    return err;
                }
            }));
    }
    
    addToken(req: HttpRequest<any>, token: string): HttpRequest<any> {
        return req.clone({ setHeaders: { Authorization: 'Bearer ' + token }})
    }    

}

// Http interceptor providers in outside-in order
export const HttpInterceptorProviders = [
	{ provide: HTTP_INTERCEPTORS, useClass: RefreshTokenInterceptor, multi: true },
];

