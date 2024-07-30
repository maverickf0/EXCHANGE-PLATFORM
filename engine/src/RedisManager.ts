import { createClient, RedisClientType } from "redis";
import { ORDER_UPDATE, TRADE_ADDED } from "./types";
import { MessageToApi } from "./types/toApi";
import { WsMessage } from "./types/toWs";

type DbMessage={
    type: typeof TRADE_ADDED,
    data:{
        id:string,
        isBuyerMaker:boolean,
        price:string,
        quantity:string,
        quotedQuantity:string,
        timestamp:number,
        market:string
    }
} | {
    type: typeof ORDER_UPDATE,
    data:{
        orderId:string,
        executedQuantity:number,
        market?:string,
        price?:string,
        quantity?:string,
        side?:'buy'|'sell'
    }

}



export class RedisManager{
    private client:RedisClientType;
    private static instance:RedisManager;

    private constructor(){
        this.client=createClient();
        this.client.connect();
    }

    public static getInstance(){
        if(!this.instance){
            this.instance=new RedisManager();
        }

        return this.instance;
    }

    public pushMessage(message:DbMessage){
        this.client.lPush("db_processor",JSON.stringify(message))
    }

    public publishedMessage(clientId:string,message:WsMessage){
        this.client.publish(clientId,JSON.stringify(message))
    }

    public sendApi(clientId:string,message:MessageToApi){
        this.client.publish(clientId,JSON.stringify(message))
    }
}