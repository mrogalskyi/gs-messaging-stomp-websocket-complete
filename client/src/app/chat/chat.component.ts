import { Component, OnInit, Input, OnDestroy } from '@angular/core';
import { RealTimeConnectionService } from '../common/services/RealTimeConnectionService';
import { StompUserSubscription } from '../common/models/StompUserSubscription';
import { Subject } from 'rxjs/Subject';

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
    private ngUnsubscribe: Subject<void> = new Subject<void>();
    constructor(private realTimeConnectionService: RealTimeConnectionService) {
    }
    ngOnInit() {
        this.subscription = this.realTimeConnectionService.getSubscription(this.subscribeUrl); // '/topic/greetings'
        this.subscription.messages
            .subscribe((greeting) => {
                this.messages = [...this.messages, JSON.parse(greeting.body).content];
            });

        this.realTimeConnectionService.Connected$
            .takeUntil(this.ngUnsubscribe)
            .subscribe(s => console.log('Connection status change: ', s));

        this.realTimeConnectionService.ConnectError
            .takeUntil(this.ngUnsubscribe)
            .subscribe(e => console.log('ConnectError: ', e));

        this.realTimeConnectionService.Connect
            .takeUntil(this.ngUnsubscribe)
            .subscribe(e => console.log('Connect: ', e));
    }
    ngOnDestroy(): void {
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
        this.subscription.unsubscribe();
    }
    send() {
        this.realTimeConnectionService.send(this.sendUrl, {}, JSON.stringify({ 'name': this.name })); // '/app/hello'
    }

}
