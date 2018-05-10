import { Component, OnInit, Input, OnDestroy } from '@angular/core';
import { RealTimeConnectionService } from '../common/services/RealTimeConnectionService';
import { StompUserSubscription } from '../common/models/StompUserSubscription';

@Component({
    selector: 'app-chat',
    templateUrl: './chat.component.html',
    styleUrls: ['./chat.component.css']
})
export class ChatComponent implements OnInit, OnDestroy {

    @Input() subscribeUrl: string;
    @Input() sendUrl: string;
    messages = [];
    name: string;
    subscription: StompUserSubscription;
    constructor(private realTimeConnectionService: RealTimeConnectionService) {
    }
    ngOnInit() {
        this.subscription = this.realTimeConnectionService.getSubscription(this.subscribeUrl); // '/topic/greetings'
        this.subscription.messages
            .subscribe((greeting) => {
                this.messages = [...this.messages, JSON.parse(greeting.body).content];
            });
    }
    ngOnDestroy(): void {
        this.subscription.unsubscribe();
    }
    send() {
        this.realTimeConnectionService.send(this.sendUrl, {}, JSON.stringify({ 'name': this.name })); // '/app/hello'
    }

}
