import * as SockJS from 'sockjs-client';
import * as Stomp from 'stompjs';
import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';
import 'rxjs/add/operator/takeUntil';
import 'rxjs/add/operator/debounceTime';
import 'rxjs/add/operator/filter';
import 'rxjs/add/operator/do';
import { StompSubscription } from './StompSubscription';
import { StompUserSubscription } from './StompUserSubscription';

export class ReconnectingSockJS {
    get Connect(): Observable<Stomp.Frame> {
        return this.connect$.asObservable();
    }
    get ConnectError(): Observable<string> {
        return this.connectError$.asObservable();
    }
    get Disconnect(): Observable<void> {
        return this.disconnect$.asObservable();
    }
    get Connected() {
        return this.client && this.client.connected;
    }

    private client: Stomp.Client;
    private reconnectAttempts = 0;

    private connect$: Subject<Stomp.Frame> = new Subject<Stomp.Frame>();
    private connectError$: Subject<string> = new Subject<string>();
    private disconnect$: Subject<void> = new Subject<void>();

    private subscriptions: { [key: string]: StompSubscription } = {};

    constructor(private url: string, private options = null) {
        this.populateOptionsWithDefault();
        if (this.options.automaticConnect === true) {
            this.connect(false);
        }
        if (this.options.forceReconnectInterval) {
            this.connect$
                .debounceTime(this.options.forceReconnectInterval)
                .filter(v => this.Connected)
                .do(v => this.client.debug('Force reconnect'))
                .subscribe(v => this.reconnect());
        }
    }
    connect(reconnectAttempt: boolean) {
        const socket = new SockJS(this.url);
        this.client = Stomp.over(socket);
        if (reconnectAttempt) {
            if (this.options.maxReconnectAttempts && this.reconnectAttempts > this.options.maxReconnectAttempts) {
                return;
            }
        } else {
            this.reconnectAttempts = 0;
        }
        this.client.connect({}, this.onConnect.bind(this), this.onConnectError.bind(this));
    }
    disconnect() {
        if (this.client) {
            this.client.disconnect(() => this.disconnect$.next());
            this.client = null;
        }
    }
    reconnect() {
        this.disconnect();
        this.connect(false);
    }
    send(destination: string, headers?: {}, body?: string) {
        if (this.client && this.client.connected) {
            this.client.send(destination, headers, body);
        }
    }
    getSubscription(endPoint: string): StompUserSubscription {
        if (!this.subscriptions[endPoint]) {
            this.addSubscriptionAndConnect(endPoint);
        }
        const clientId = this.subscriptions[endPoint].addClient();
        const until = new Subject<void>();
        return {
            messages: this.subscriptions[endPoint].Messages.takeUntil(until),
            unsubscribe: () => {
                until.next();
                until.complete();
                this.clientUnsubscribe(endPoint, clientId);
            }
        };
    }

    private onConnect(frame: Stomp.Frame) {
        for (const endPoint in this.subscriptions) {
            if (this.subscriptions.hasOwnProperty(endPoint)) {
                this.clientSubscribe(endPoint);
            }
        }
        this.connect$.next(frame);
    }
    private onConnectError(error: string) {
        this.client = null;
        this.connectError$.next(error);
        const timeout = this.options.reconnectInterval * Math.pow(this.options.reconnectDecay, this.reconnectAttempts);
        setTimeout(() => {
            this.reconnectAttempts++;
            this.connect(true);
        }, timeout > this.options.maxReconnectInterval ? this.options.maxReconnectInterval : timeout);
    }
    private populateOptionsWithDefault() {
        const settings = {
            automaticConnect: true,
            maxReconnectAttempts: null,
            reconnectInterval: 1000,
            maxReconnectInterval: 10000,
            reconnectDecay: 1.5,
            forceReconnectInterval: 300000 // 5min
        };
        if (!this.options) {
            this.options = {};
        }
        for (const key in settings) {
            if (typeof this.options[key] === 'undefined') {
                this.options[key] = settings[key];
            }
        }
    }
    private addSubscriptionAndConnect(endPoint: string) {
        this.subscriptions[endPoint] = new StompSubscription();
        if (this.client && this.client.connected) {
            this.clientSubscribe(endPoint);
        }
    }
    private clientSubscribe(endPoint: string) {
        const sub = this.client.subscribe(endPoint, (msg) => this.subscriptions[endPoint].publish(msg));
        this.subscriptions[endPoint].SubscriptionId = sub.id;
    }
    private clientUnsubscribe(endPoint: string, clientId: string) {
        const sub = this.subscriptions[endPoint];
        sub.removeClient(clientId);
        if (!sub.HasClients) {
            delete this.subscriptions[endPoint];
            if (this.client && this.client.connected) {
                (<any>this.client).unsubscribe(sub.SubscriptionId);
            }
        }
    }

}
