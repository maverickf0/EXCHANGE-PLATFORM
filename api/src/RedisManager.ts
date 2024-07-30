import { createClient, RedisClientType } from "redis"
import { MessageToEngine } from "./types/to";
import { MessageFromOrderBook } from "./types";

export class RedisManager{
    private client:RedisClientType;
    private publisher:RedisClientType;
    private static instance:RedisManager;

    private constructor(){
        this.client=createClient();
        this.client.connect();
        this.publisher=createClient();
        this.publisher.connect();
    }

    public static getInstance(){
        if(!this.instance){
            this.instance=new RedisManager();
        }

        return this.instance;
    }

    public sendAndAwait(message:MessageToEngine){

        // return a promise that would be resolved when we unsubscribe
        return new Promise<MessageFromOrderBook>((resolve)=>{
            const id=this.getRandomClientId();
            this.client.subscribe(id,(message)=>{
                this.client.unsubscribe(id);
                resolve(JSON.parse(message))
            })

            //we push the message on to the redis queue
            this.publisher.lPush("messages", JSON.stringify({clientId:id, message}))
        })
    }

    public getRandomClientId(){
        return Math.random().toString(36).substring(2,15)+Math.random().toString(36).substring(2,15);
    }
}