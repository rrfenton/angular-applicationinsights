import { Injectable } from '@angular/core';

@Injectable()
export class Tools {
    static isDefined(val: any) {
      return val !== undefined;
    }

    static isUndefined(val: any) {
      return val === undefined;
    }

    static isString(val: any) {
      return typeof val === 'string';
    }

    static isArray(val) {
      return Array.isArray(val);
    }

    static isObject(val) {
      return val != null && typeof val === 'object';
    }

    static toJson(val, pretty?: boolean) {
      if (pretty) {
        return JSON.stringify(val, null, 2);
      }
      return JSON.stringify(val);
    }

    static fromJson(obj: string) {
      return JSON.parse(obj);
    }

    static isNullOrUndefined(val) {
        return val === undefined || val === null;
    }

    static isNumber(n: any) {
        return !isNaN(parseFloat(n)) && isFinite(n);
    }

/* tslint:disable:no-bitwise */
    static generateGuid() {
        const value = [];
        const digits = '0123456789abcdef';
        for (let i = 0; i < 36; i++) {
            value[i] = digits.substr(Math.floor(Math.random() * 0x10), 1);
        }
        value[8] = value[13] = value[18] = value[23] = '-';
        value[14] = '4';
        value[19] = digits.substr((value[19] & 0x3) | 0x8, 1);
        return value.join('');
    }
/* tslint:enable:no-bitwise */


}
