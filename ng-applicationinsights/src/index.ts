import { StackParser } from './stack-parser/stack-parser.service';
import { AppInsightsStorage } from './storage/app-insights-storage.service';
import { ApplicationInsights } from './application-insights/application-insights';
import './polyfills.ts';

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { HttpModule } from '@angular/http';
import 'rxjs/add/operator/mergeMap';


@NgModule({
  imports: [
    CommonModule,
    HttpModule,
    ApplicationInsights,
    AppInsightsStorage,
    StackParser
  ],
  providers: [],
})

export class NgApplicationInsightsRootModule { }
