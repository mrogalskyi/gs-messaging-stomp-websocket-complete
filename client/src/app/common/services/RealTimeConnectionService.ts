import { Injectable } from '@angular/core';
import { ReconnectingSockJS } from '../models/ReconnectingSockJS';

@Injectable()
export class RealTimeConnectionService {
    client: ReconnectingSockJS;
    get Connected() {
        return this.client.Connected;
    }
    constructor() {
        this.client = new ReconnectingSockJS('http://localhost:8080/gs-guide-websocket');
    }
    send(destination: string, headers?: {}, body?: string) {
        this.client.send(destination, headers, body);
    }
    getSubscription(endPoint: string) {
        return this.client.getSubscription(endPoint);
    }
}
