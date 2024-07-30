import WebSocket from "ws"
import { SubscriptionManager } from "./SubscriptionManager";
import { IncomingMessage, SUBSCRIBE, UNSUBSCRIBE } from "./types/in";
import { OutgoingMessage } from "./types/out";

export class User{
    private id: string;
    private ws: WebSocket;

    constructor(id: string, ws: WebSocket){
        this.id = id;
        this.ws = ws;
        this.addListeners();
    }

    private subscription: string[] = [];

    public subscribe(subscription: string){
        this.subscription.push(subscription);
    }

    public unsubscribe(subscription: string){
        this.subscription.push(subscription);
    }

    emit(message: OutgoingMessage){
        this.ws.send(JSON.stringify(message));
    }

    private addListeners(){
        this.ws.on('message',(message:string)=>{
            const parsedMessage: IncomingMessage = JSON.parse(message);
            if(parsedMessage.method === SUBSCRIBE){
                parsedMessage.params.forEach(s=>SubscriptionManager.getInstance().subscribe(this.id, s));
            }
            else if(parsedMessage.method === UNSUBSCRIBE){
                parsedMessage.params.forEach(s=>SubscriptionManager.getInstance().unsubscribe(this.id, parsedMessage.params[0]))
            }
        })
    }
}