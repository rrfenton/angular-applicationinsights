import { Tools } from './../tools/tools.service';
import { Injectable } from '@angular/core';

/*
* Storage is heavily based on the angular storage module by Gregory Pike (https://github.com/grevory/angular-local-storage)
*/

@Injectable()
export class AppInsightsStorage {

    private static defaultConfig = {
        prefix: 'ls',

        // You could change web storage type localstorage or sessionStorage
        storageType: 'localStorage',

        // Cookie options (usually in case of fallback)
        // expiry = Number of days before cookies expire // 0 = Does not expire
        // path = The web path the cookie represents
        cookie: {
            expiry: 30,
            path: '/'
        },

        // Send signals for each of the following actions?
        notify: {
            setItem: true,
            removeItem: false
        }
    };

    private _config;
    private _self;
    private _prefix;
    private _cookie;
    private _notify;
    private _storageType;
    private _webStorage;
    private _$window;
    private _$document;
    private _deriveQualifiedKey;


    constructor(tools: Tools) {

        this._config = Object.assign(AppInsightsStorage.defaultConfig);
        this._self = this._config;
        this._prefix = this._config.prefix;
        this._cookie = this._config.cookie;
        this._notify = this._config.notify;
        this._storageType = this._config.storageType;
        this._$window = window;
        this._$document = document;

        // When Angular's $document is not available
        if (!this._$document) {
            this._$document = document;
        } else if (this._$document[0]) {
            this._$document = this._$document[0];
        }

        // If there is a prefix set in the config lets use that with an appended period for readability
        if (this._prefix.substr(-1) !== '.') {
            this._prefix = !!this._prefix ? this._prefix + '.' : '';
        }
        this._deriveQualifiedKey = (key) => {
            return this._prefix + key;
        };

    }


    // Test if string is only contains numbers
    // e.g '1' => true, "'1'" => true
    private isStringNumber(num) {
        return /^-?\d+\.?\d*$/.test(num.replace(/["']/g, ''));
    }

    private browserSupportsLocalStorage() {
        try {
            let supported = (this._storageType in this._$window && this._$window[this._storageType] !== null);

            // When Safari (OS X or iOS) is in private browsing mode, it appears as though localStorage
            // is available, but trying to call .setItem throws an exception.
            //
            // "QUOTA_EXCEEDED_ERR: DOM Exception 22: An attempt was made to add something to storage
            // that exceeded the quota."
            let key = this._deriveQualifiedKey('__' + Math.round(Math.random() * 1e7));
            if (supported) {
                this._webStorage = this._$window[this._storageType];
                this._webStorage.setItem(key, '');
                this._webStorage.removeItem(key);
            }

            return supported;
        } catch (e) {
            this._storageType = 'cookie';
            return false;
        }
    }

    // Checks the browser to see if cookies are supported
    browserSupportsCookies() {
        try {
            return this._$window.navigator.cookieEnabled ||
            ('cookie' in this._$document && (this._$document.cookie.length > 0 ||
            (this._$document.cookie = 'test').indexOf.call(this._$document.cookie, 'test') > -1));
        } catch (e) {
            return false;
        }
    }

    // Directly adds a value to cookies
    // Typically used as a fallback is local storage is not available in the browser
    // Example use: localStorageService.cookie.add('library','angular');
    addToCookies(key, value) {

        if (Tools.isUndefined(value)) {
            return false;
        } else if (Tools.isArray(value) || Tools.isObject(value)) {
            value = Tools.toJson(value);
        }

        if (!this.browserSupportsCookies) {
            return false;
        }

        try {
            let expiry = '',
                expiryDate = new Date(),
                cookieDomain = '';

            if (value === null) {
                // Mark that the cookie has expired one day ago
                expiryDate.setTime(expiryDate.getTime() + (-1 * 24 * 60 * 60 * 1000));
                expiry = '; expires=' + expiryDate.toUTCString();
                value = '';
            } else if (this._cookie.expiry !== 0) {
                expiryDate.setTime(expiryDate.getTime() + (this._cookie.expiry * 24 * 60 * 60 * 1000));
                expiry = '; expires=' + expiryDate.toUTCString();
            }
            if (!!key) {
                let cookiePath = '; path=' + this._cookie.path;
                if (this._cookie.domain) {
                    cookieDomain = '; domain=' + this._cookie.domain;
                }
                this._$document.cookie =
                  this._deriveQualifiedKey(key) + '=' + encodeURIComponent(value) + expiry + cookiePath + cookieDomain;
            }
        } catch (e) {
            return false;
        }
        return true;
    }

    // Directly get a value from a cookie
    // Example use: localStorageService.cookie.get('library'); // returns 'angular'
    getFromCookies(key) {
        if (!this.browserSupportsCookies) {
            return false;
        }

        let cookies = this._$document.cookie && this._$document.cookie.split(';') || [];
        for (let i = 0; i < cookies.length; i++) {
            let thisCookie = cookies[i];
            while (thisCookie.charAt(0) === ' ') {
                thisCookie = thisCookie.substring(1, thisCookie.length);
            }
            if (thisCookie.indexOf(this._deriveQualifiedKey(key) + '=') === 0) {
                let storedValues = decodeURIComponent(thisCookie.substring(this._prefix.length + key.length + 1, thisCookie.length));
                try {
                    let obj = JSON.parse(storedValues);
                    return Tools.fromJson(obj);
                } catch (e) {
                    return storedValues;
                }
            }
        }
        return null;
    }


    // Directly adds a value to local storage
    // If local storage is not available in the browser use cookies
    // Example use: localStorageService.add('library','angular');
    private addToLocalStorage(key, value) {

        // Let's convert undefined values to null to get the value consistent
        if (Tools.isUndefined(value)) {
            value = null;
        } else if (Tools.isObject(value) || Tools.isArray(value) || Tools.isNumber(+value || value)) {
            value = Tools.toJson(value);
        }

        // If this browser does not support local storage use cookies
        if (!this.browserSupportsLocalStorage() || this._self.storageType === 'cookie') {
            return this.addToCookies(key, value);
        }

        try {
            if (Tools.isObject(value) || Tools.isArray(value)) {
                value = Tools.toJson(value);
            }
            if (this._webStorage) {
                this._webStorage.setItem(this._deriveQualifiedKey(key), value);
            }
        } catch (e) {

            return this.addToCookies(key, value);
        }
        return true;
    }

    // Directly get a value from local storage
    // Example use: localStorageService.get('library'); // returns 'angular'
    private getFromLocalStorage(key) {

        if (!this.browserSupportsLocalStorage() || this._self.storageType === 'cookie') {

            return this.getFromCookies(key);
        }

        let item = this._webStorage ? this._webStorage.getItem(this._deriveQualifiedKey(key)) : null;
        // angular.toJson will convert null to 'null', so a proper conversion is needed
        // FIXME not a perfect solution, since a valid 'null' string can't be stored
        if (!item || item === 'null') {
            return null;
        }

        if (item.charAt(0) === '{' || item.charAt(0) === '[' || this.isStringNumber(item)) {
            return Tools.fromJson(item);
        }

        return item;
    }


    getStorageType() {
        return this._storageType;
    }

    isSupported() {
        return this.browserSupportsLocalStorage();
    }


    set(key: any, value: any) {
        return this.addToLocalStorage(key, value);
    }

    get(key: any) {
        return this.getFromLocalStorage(key);
    }


    deriveKey(key: any) {
        return this._deriveQualifiedKey(key);
    }


    isCookiesSupported() {
        return this.browserSupportsCookies();
    }

    setCookie(key: any, value: any) {
        this.addToCookies(key, value);
    }

    getCookie(key: any) {
        return this.getFromCookies(key);
    }

}
