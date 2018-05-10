import { NgModule } from '@angular/core';
import { CommonModule as AngularCommonModule } from '@angular/common';
import { RealTimeConnectionService } from './services/RealTimeConnectionService';

@NgModule({
    imports: [
        AngularCommonModule
    ],
    providers: [
        RealTimeConnectionService
    ]
})
export class CommonModule { }
