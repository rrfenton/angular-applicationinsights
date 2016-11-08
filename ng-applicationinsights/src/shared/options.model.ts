export class AppInsightsOptions {
    constructor(
      public instrumentationKey: string,
      public applicationName: string,
      public autoPageViewTracking = true,
      public autoExceptionTracking = true,
      public sessionInactivityTimeout = 1800000,
      public developerMode = false
    ) {
    }
}

