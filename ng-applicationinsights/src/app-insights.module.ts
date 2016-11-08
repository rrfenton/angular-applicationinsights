import { AppInsightsOptions } from './shared/options.model';
import { ApplicationInsightsTrackService } from './shared/application-insights-track.service';
import { ExceptionInterceptor } from './exception-interceptor/exception-interceptor.service';
import { Tools } from './tools/tools.service';
import { StackParser } from './stack-parser/stack-parser.service';
import { AppInsightsStorage } from './storage/app-insights-storage.service';
import { ApplicationInsights } from './application-insights/application-insights';

import { NgModule, ModuleWithProviders, ErrorHandler } from '@angular/core';
import { CommonModule } from '@angular/common';

import { HttpModule } from '@angular/http';
import 'rxjs/add/operator/mergeMap';


@NgModule({

  imports: [
    CommonModule,
    HttpModule
  ],
  providers: [
    ApplicationInsights,
    AppInsightsStorage,
    {
        provide: ErrorHandler,
        useClass: ExceptionInterceptor
    },
    ApplicationInsightsTrackService,
    StackParser,
    Tools
  ],
  exports: [],
})

export class NgApplicationInsights {
  static forRoot(appInsightsOptions: AppInsightsOptions): ModuleWithProviders  {
    return {
      ngModule: NgApplicationInsights,
      providers: [{provide: AppInsightsOptions, useValue: appInsightsOptions }]
    };
  }
}
