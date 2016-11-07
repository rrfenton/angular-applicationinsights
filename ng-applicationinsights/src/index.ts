import './polyfills.ts';

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { HttpModule } from '@angular/http';


@NgModule({
  imports: [
    CommonModule,
    HttpModule
  ],
  providers: [],
})

export class NgApplicationInsightsRootModule { }
