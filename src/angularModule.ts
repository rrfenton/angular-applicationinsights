/// <reference path="./ApplicationInsights.ts" />
declare var angular: angular.IAngularStatic;

// Application Insights Module
var angularAppInsights = angular.module("ApplicationInsightsModule", []);
var logInterceptor: LogInterceptor;
var exceptionInterceptor: ExceptionInterceptor;
var tools = new Tools(angular);

// setup some features that can only be done during the configure pass
angularAppInsights.config([
    "$provide", $provide => {
        logInterceptor = new LogInterceptor($provide, angular);
        exceptionInterceptor = new ExceptionInterceptor($provide);
    }
]);

angularAppInsights.provider("applicationInsightsService", () => new AppInsightsProvider());

angularAppInsights.run([
    "$rootScope", "$location", "$interval", "applicationInsightsService", ($rootScope, $location, $interval: angular.IIntervalService, applicationInsightsService: ApplicationInsights) => {
        
        // configures auto page view tracking.
        $rootScope.$on("$locationChangeSuccess", () => {

            if (applicationInsightsService.options.autoPageViewTracking) {
                applicationInsightsService.trackPageView(applicationInsightsService.options.applicationName + $location.path());
            }
        });

      
        // browser performance data may not be ready, so run the check during an interval callback.
        var promise = $interval(() => {

            if (applicationInsightsService.isPerformanceTimingDataReady()) {
                applicationInsightsService.trackPageViewPerformance(applicationInsightsService.options.applicationName + $location.path());
                // cancel the interval once the performance telemetry is sent.
                $interval.cancel(promise);
            }
        }, 250);
    }
]);


class AppInsightsProvider implements angular.IServiceProvider {
    // configuration properties for the provider
    private _options = new Options();

    configure(instrumentationKey, applicationName, enableAutoPageViewTracking) {
        if (Tools.isString(applicationName)) {
            this._options.instrumentationKey = instrumentationKey;
            this._options.applicationName = applicationName;
            this._options.autoPageViewTracking = Tools.isNullOrUndefined(enableAutoPageViewTracking) ? true : enableAutoPageViewTracking;
        } else {
            Tools.extend(this._options, applicationName);
            this._options.instrumentationKey = instrumentationKey;
        }
    } // invoked when the provider is run
    $get = [
        "$http", "$locale", "$window", "$location", "$rootScope", "$parse", "$document", ($http, $locale, $window, $location, $rootScope, $parse, $document) => {

            // get a reference of storage
            var storage = new AppInsightsStorage({
                window: $window,
                rootScope: $rootScope,
                document: $document,
                parse: $parse
            });

            return new ApplicationInsights(storage, $http, $locale, $window, $location, logInterceptor, exceptionInterceptor, this._options);
        }
    ];


}