import { ApplicationInsightsTrackService } from './../shared/application-insights-track.service';
import { StackParser } from './../stack-parser/stack-parser.service';
import { Tools } from './../tools/tools.service';
import { Options } from './../shared/options.model';
import { ExceptionInterceptor } from './../exception-interceptor/exception-interceptor.service';
import { AppInsightsStorage } from './../storage/app-insights-storage.service';
import { Injectable } from '@angular/core';

@Injectable()
export class ApplicationInsights {

    private static namespace = 'Microsoft.ApplicationInsights.';
    private static names = {
        pageViews: ApplicationInsights.namespace + 'Pageview',
        traceMessage: ApplicationInsights.namespace + 'Message',
        events: ApplicationInsights.namespace + 'Event',
        metrics: ApplicationInsights.namespace + 'Metric',
        exception: ApplicationInsights.namespace + 'Exception'
    };

    private static types = {
        pageViews: ApplicationInsights.namespace + 'PageViewData',
        traceMessage: ApplicationInsights.namespace + 'MessageData',
        events: ApplicationInsights.namespace + 'EventData',
        metrics: ApplicationInsights.namespace + 'MetricData',
        exception: ApplicationInsights.namespace + 'ExceptionData'
    };

    private _sessionKey = '$$appInsights__session';
    options: Options;

    private _commonProperties: any;

    private _version = 'angular:0.2.8';

    constructor(private localStorage: AppInsightsStorage,
        private exceptionInterceptor: ExceptionInterceptor,
        private appInsightsStorage: AppInsightsStorage,
        private appInsightsTrackService: ApplicationInsightsTrackService,
        options: Options) {

        if (this.options.autoExceptionTracking) {
            this.exceptionInterceptor.setInterceptFunction((exception, cause) => this.trackException(exception, cause));
        }

    }

    trackPageView(pageName?, pageUrl?, properties?, measurements?, duration?: number) {
        // TODO: consider possible overloads (no name or url but properties and measurements)
        const data = this.generateAppInsightsData(ApplicationInsights.names.pageViews,
            ApplicationInsights.types.pageViews,
            {
                ver: 1,
                url: Tools.isNullOrUndefined(pageUrl) ? pageUrl : pageUrl,
                name: Tools.isNullOrUndefined(pageName) ? pageName : pageName,
                properties: this.validateProperties(properties),
                measurements: this.validateMeasurements(measurements),
                duration: this.validateDuration(duration)
            });

        this.sendData(data);
    }

    trackEvent(eventName, properties, measurements) {
        const data = this.generateAppInsightsData(ApplicationInsights.names.events,
            ApplicationInsights.types.events,
            {
                ver: 1,
                name: eventName,
                properties: this.validateProperties(properties),
                measurements: this.validateMeasurements(measurements)
            });

        this.sendData(data);
    }

    trackTraceMessage(message, level, properties?) {
        if (Tools.isNullOrUndefined(message) || !Tools.isString(message)) {
            return;
        }
        const data = this.generateAppInsightsData(ApplicationInsights.names.traceMessage,
            ApplicationInsights.types.traceMessage,
            {
                ver: 1,
                message: message,
                severityLevel: this.validateSeverityLevel(level),
                properties: this.validateProperties(properties)
            });

        this.sendData(data);
    }

    trackMetric(name, value, properties) {
        const data = this.generateAppInsightsData(ApplicationInsights.names.metrics,
            ApplicationInsights.types.metrics,
            {
                ver: 1,
                metrics: [{ name: name, value: value }],
                properties: this.validateProperties(properties)
            });
        this.sendData(data);
    }

    trackException(exception, cause) {
        if (Tools.isNullOrUndefined(exception)) {
            return;
        }

        // parse the stack
        const parsedStack = StackParser.parse(exception);
        const data = this.generateAppInsightsData(ApplicationInsights.names.exception,
            ApplicationInsights.types.exception,
            {
                ver: 1,
                handledAt: 'Unhandled',
                exceptions: [
                    {
                        typeName: exception.name,
                        message: exception.message,
                        stack: exception.stack,
                        parsedStack: parsedStack,
                        hasFullStack: !Tools.isNullOrUndefined(parsedStack)
                    }
                ]
            });
        this.sendData(data);
    }

    setCommonProperties(data) {
        this.validateProperties(data);
        this._commonProperties = this._commonProperties || {};
        Object.assign(this._commonProperties, data);
    }

    private getUniqueId() {
        const uuidKey = '$$appInsights__uuid';
        // see if there is already an id stored locally, if not generate a new value
        let uuid = this.localStorage.get(uuidKey);
        if (Tools.isNullOrUndefined(uuid)) {
            uuid = Tools.generateGuid();
            this.localStorage.set(uuidKey, uuid);
        }
        return uuid;
    }

    private makeNewSession() {
        // no existing session data
        let sessionData = {
            id: Tools.generateGuid(),
            accessed: new Date().getTime()
        };
        this.localStorage.set(this._sessionKey, sessionData);
        return sessionData;
    }

    private getSessionId() {

        let sessionData = this.localStorage.get(this._sessionKey);

        if (Tools.isNullOrUndefined(sessionData)) {

            // no existing session data
            sessionData = this.makeNewSession();
        } else {


            let lastAccessed = Tools.isNullOrUndefined(sessionData.accessed) ? 0 : sessionData.accessed;
            let now = new Date().getTime();
            if ((now - lastAccessed > this.options.sessionInactivityTimeout)) {

                // this session is expired, make a new one
                sessionData = this.makeNewSession();
            } else {

                // valid session, update the last access timestamp
                sessionData.accessed = now;
                this.localStorage.set(this._sessionKey, sessionData);
            }
        }

        return sessionData.id;
    }


    private validateMeasurements(measurements) {
        if (Tools.isNullOrUndefined(measurements)) {
            return null;
        }

        if (!Tools.isObject(measurements)) {
            console.warn('The value of the measurements parameter must be an object consisting of a string/number pairs.');
            return null;
        }

        let validatedMeasurements = {};
        for (let metricName in measurements) {
            if (Tools.isNumber(measurements[metricName])) {
                validatedMeasurements[metricName] = measurements[metricName];
            } else {
                console.warn(`The value of measurement ${metricName} is not a number.`);
            }
        }

        return validatedMeasurements;
    }


    private validateProperties(properties) {

        if (Tools.isNullOrUndefined(properties)) {
            return null;
        }

        if (!Tools.isObject(properties)) {
            console.warn('The value of the properties parameter must be an object consisting of a string/string pairs.');
            return null;
        }

        let validateProperties = {};

        for (let propName in properties) {
            if (!Tools.isNullOrUndefined(properties[propName])
              && !Tools.isObject(properties[propName])
              && !Tools.isArray(properties[propName])) {
                validateProperties[propName] = properties[propName];
            } else {
              console.warn(`The value of property ${propName} could not be determined to be a string or number.`);
            }
        }
        return validateProperties;
    }

    private validateDuration(duration) {

        if (Tools.isNullOrUndefined(duration)) {
            return null;
        }

        if (!Tools.isNumber(duration) || duration < 0) {
          console.warn('The value of the durations parameter must be a positive number');
          return null;
        }

        return duration;
    }

    private validateSeverityLevel(level) {
        /*
https://github.com/Microsoft/ApplicationInsights-JS/blob/7bbf8b7a3b4e3610cefb31e9d61765a2897dcb3b/JavaScript/JavaScriptSDK/Contracts/Generated/SeverityLevel.ts

         export enum SeverityLevel
         {
            Verbose = 0,
            Information = 1,
            Warning = 2,
            Error = 3,
            Critical = 4,
         }

         We need to map the angular $log levels to these for app insights
         */
        const levels = [
            'debug', // Verbose
            'info', // Information
            'warn', // Warning
            'error' // Error
        ];
        let levelEnum = levels.indexOf(level);
        return levelEnum > -1 ? levelEnum : 0;
    }


    private sendData(data) {
        if (this.options.developerMode) {
            console.log(data);
            return;
        }

        this.appInsightsTrackService.sendData(data).subscribe();
    }

    private generateAppInsightsData(payloadName, payloadDataType, payloadData) {

        if (this._commonProperties) {
            payloadData.properties = payloadData.properties || {};
            Object.assign(payloadData.properties, this._commonProperties);
        }

        return {
            name: payloadName,
            time: new Date().toISOString(),
            ver: 1,
            iKey: this.options.instrumentationKey,
            user: {
                id: this.getUniqueId(),
                type: 'User'
            },
            session: {
                id: this.getSessionId()
            },
            operation: {
                id: Tools.generateGuid()
            },
            device: {
                id: 'browser',
                resolution: window.screen.availWidth + 'x' + window.screen.availHeight,
                type: 'Browser'
            },
            internal: {
                sdkVersion: this._version
            },
            data: {
                type: payloadDataType,
                item: payloadData
            }
        };
    }
}
