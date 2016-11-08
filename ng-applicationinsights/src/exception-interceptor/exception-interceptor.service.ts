import { ErrorHandler, Injectable } from '@angular/core';
// Exception interceptor
// Intercepts exceptions and sends them to Application insights as exception telemetry.
@Injectable()
export class ExceptionInterceptor extends ErrorHandler {
    private _interceptFunction;

    setInterceptFunction(func) {
        this._interceptFunction = func;
    }

    handleError(error: Error) {
      this._interceptFunction(error);
      super.handleError(error);
    }

    constructor() {
      super(true);
    }

}
