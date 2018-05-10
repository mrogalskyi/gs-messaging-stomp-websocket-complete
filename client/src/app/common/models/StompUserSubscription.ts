import * as Stomp from 'stompjs';
import { Observable } from 'rxjs/Observable';

export interface StompUserSubscription {
    messages: Observable<Stomp.Message>;
    unsubscribe: () => void;
}
