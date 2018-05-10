import { Subject } from 'rxjs/Subject';
import * as Stomp from 'stompjs';

export class StompSubscription {
    get HasClients(): boolean {
        return !!this.clientIds.length;
    }
    get Messages() {
        return this.messages.asObservable();
    }
    get SubscriptionId() {
        return this.subscriptionId;
    }
    set SubscriptionId(id: string) {
        this.subscriptionId = id;
    }
    private messages: Subject<Stomp.Message> = new Subject<Stomp.Message>();
    private subscriptionId?: string;
    private clientIds?: string[] = [];
    constructor() {
    }
    publish(message: Stomp.Message) {
        this.messages.next(message);
    }
    addClient(): string {
        const clientId = this.guid();
        this.clientIds = [...this.clientIds, clientId];
        return clientId;
    }
    removeClient(clientId: string) {
        const index = this.clientIds.indexOf(clientId);
        if (index > -1) {
            this.clientIds = [...this.clientIds.slice(0, index), ...this.clientIds.slice(index + 1)];
        }
    }
    private guid() {
        return this.s4() + this.s4() + '-' + this.s4() + '-' + this.s4() + '-' + this.s4() + '-' + this.s4() + this.s4() + this.s4();
    }
    private s4() {
        return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
    }
}

