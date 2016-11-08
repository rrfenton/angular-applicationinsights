import './polyfills.ts';

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { HttpModule } from '@angular/http';
import 'rxjs/add/operator/mergeMap';


@NgModule({
  imports: [
    CommonModule,
    HttpModule
  ],
  providers: [],
})

export class NgApplicationInsightsRootModule { }
