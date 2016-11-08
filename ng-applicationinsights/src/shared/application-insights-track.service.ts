import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Http, RequestOptions, Headers } from '@angular/http';
import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/map';

@Injectable()
export class ApplicationInsightsTrackService {
    private _analyticsServiceUrl = 'https://dc.services.visualstudio.com/v2/track';
    private _contentType = 'application/json';
    constructor(private http: Http) {

    }

    sendData(data): Observable<string> {
        let options = new RequestOptions();
        options.headers = new Headers();
        options.headers.append('Accept', this._contentType);
        options.headers.append('Content-Type', this._contentType);

        return this.http.post(this._analyticsServiceUrl, data, options)
        .map((res) => {
          return res.json();
        })
        .catch((error) => {
          return this.handleError(error);
        });
    }

    private handleError(error: any) {
        // supressing of exceptions on the initial http call in order to prevent infinate loops with the error interceptor.
        const errMsg = (error.message) ? error.message :
            error.status ? `${error.status} - ${error.statusText}` : 'Server error';
        console.error(errMsg); // log to console instead
        return Observable.throw(error);
    }
}
