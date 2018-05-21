import { Injectable } from '@angular/core';
import { ReconnectingSockJS } from '../models/ReconnectingSockJS';
import { Observable } from 'rxjs/Observable';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import 'rxjs/add/operator/merge';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/startWith';
import 'rxjs/add/operator/distinctUntilChanged';
import * as Stomp from 'stompjs';

@Injectable()
export class RealTimeConnectionService {
    client: ReconnectingSockJS;
    get Connected$() {
        return this.connected$.asObservable();
    }
    get Connected() {
        return this.client.Connected;
    }
    get Connect(): Observable<Stomp.Frame> {
        return this.client.Connect;
    }
    get ConnectError(): Observable<string> {
        return this.client.ConnectError;
    }
    get Disconnect(): Observable<void> {
        return this.client.Disconnect;
    }
    private connected$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
    constructor() {
        this.client = new ReconnectingSockJS('http://localhost:8080/gs-guide-websocket');

        this.client.Connect
            .merge(this.client.ConnectError, this.client.Disconnect)
            .startWith()
            .map(v => !!this.Connected)
            .distinctUntilChanged()
            .subscribe(this.connected$);
    }
    send(destination: string, headers?: {}, body?: string) {
        this.client.send(destination, headers, body);
    }
    getSubscription(endPoint: string) {
        return this.client.getSubscription(endPoint);
    }
}
