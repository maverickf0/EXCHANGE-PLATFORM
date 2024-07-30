import { RedisManager } from "../RedisManager";
import { ORDER_UPDATE } from "../types";
import { CANCEL_ORDER, MessageFromApi } from "../types/fromApi";
import { Fill, Order, Orderbook } from "./Orderbook";
import fs from 'fs'

export const BASE_CURRENCY = "INR";

interface UserBalance{
    [key:string]:{
        available: number;
        locked: number;
    }
}

export class Engine{
    private orderbooks: Orderbook[]=[];
    private balances:Map<string,UserBalance>=new Map();

    constructor(){
        let snapshot=null
        try{
            if(process.env.WITH_SNAPSHOT){
                snapshot = fs.readFileSync("./snapshot.json")
            }
        }catch(e){
            console.log("No snapshot found")
        }

        if(snapshot){
            const snapShotJson=JSON.parse(snapshot.toString())
            this.orderbooks=snapShotJson.orderbooks.map((o:any)=>new Orderbook(o.baseAsset,o.bids,o.asks,o.lastTradeId, o.currentPrice))
            this.balances=new Map(snapShotJson.balances)
        }
        else{
            this.orderbooks=[new Orderbook(`TATA`,[],[],0,0)]
            this.setBaseBalance();
        }
        setInterval(()=>{
            this.saveSnapshot()
        },1000*3);
    }

    saveSnapshot(){
        const snapShotJson={
            orderbooks:this.orderbooks.map((o)=>o.getSnapShot()),
            balances:Array.from(this.balances.entries())
        }
        fs.writeFileSync("./snapshot.json",JSON.stringify(snapShotJson));
    }

    process({message,clientId}:{message:MessageFromApi,clientId:string}){
        switch(message.type){
            case "CREATE_ORDER":
                try{
                    const {executedQty,fills,orderId}=this.createOrder(message.data.market,message.data.price,message.data.quantity,message.data.side,message.data.userId);
                    RedisManager.getInstance().sendApi(clientId,{
                        type:'ORDER_PLACED',
                        payload:{
                            orderId,
                            executedQty,
                            fills
                        }
                    })
                }
                catch(e){
                    console.log(e);
                    RedisManager.getInstance().sendApi(clientId, {
                        type: "ORDER_CANCELLED",
                        payload: {
                            orderId: "",
                            executedQty: 0,
                            remainingQty: 0
                        }
                    });
                }
                break;
            case CANCEL_ORDER:
                try{
                    const orderId=message.data.orderId;
                    const cancelMarket=message.data.market;
                    const cancelOrderbook=this.orderbooks.find(o=>o.ticker()===cancelMarket);
                    const quoteAsset=cancelOrderbook?.quoteAsset;

                    if(!cancelOrderbook){
                        throw new Error('No orderbook found')
                    }

                    const order=cancelOrderbook.asks.find(o=>o.orderId===orderId) || cancelOrderbook.bids.find(o=>o.orderId===orderId);

                    if(!order){
                        console.log("no order found")
                        throw new Error('No order found')
                    }

                    if(order.side==="buy"){
                        const price=cancelOrderbook.cancelBids(order);
                        const leftQuantity=(order.quantity-order.filled) * order.price;

                        //@ts-ignore
                        this.balances.get(order.userId)[BASE_CURRENCY].available += leftQuantity;
                        //@ts-ignore
                        this.balances.get(order.userId)[BASE_CURRENCY].locked -= leftQuantity;

                        if(price){
                            this.sendUpdatedDepthAt(price.toString(),cancelMarket);
                        }
                    }
                    else{
                        
                        const price=cancelOrderbook.cancelAsk(order);
                        const leftQuantity=(order.quantity-order.filled) ;
    
                        //@ts-ignore
                        this.balances.get(order.userId)[quoteAsset].available += leftQuantity;
                        //@ts-ignore
                        this.balances.get(order.userId)[quoteAsset].locked -= leftQuantity;
    
                        if(price){
                            this.sendUpdatedDepthAt(price.toString(),cancelMarket);
                        }
                    }

                    RedisManager.getInstance().sendApi(clientId,{
                        type:"ORDER_CANCELLED",
                        payload:{
                            orderId,
                            executedQty:0,
                            remainingQty:0
                        }
                    })
                }
                catch(e){
                    console.log("Error while handling cancelled order")
                    console.log(e);
                }
                break;
            case "ON_RAMP":
                try{
                    const userId = message.data.userId;
                    const amount = Number(message.data.amount);

                    this.onRamp(userId,amount);
                }
                catch(e){
                    console.log("Error Found in on Ramp")
                }
                break;
            case "GET_DEPTH":
                try{
                    const {market}=message.data;
                    const orderbook=this.orderbooks.find(o=>o.ticker()===market);

                    if(!orderbook){
                        throw new Error("Orderbook Not Found")
                    }
                    
                    RedisManager.getInstance().sendApi(clientId,{
                        type:"DEPTH",
                        payload:orderbook.getDepth()
                    })
                }
                catch(e){
                    console.log(e);
                    RedisManager.getInstance().sendApi(clientId, {
                        type: "DEPTH",
                        payload: {
                            bids: [],
                            asks: []
                        }
                    });
                }
                break;
            case "GET_OPEN_ORDERS":
                try{
                    const {userId,market}=message.data;

                    const openOrderbook=this.orderbooks.find(o=>o.ticker() === market)

                    if(!openOrderbook){
                        throw new Error("Orderbook not found");
                    }

                    const openOrder=openOrderbook.getOpenOrders(userId);
                    
                    RedisManager.getInstance().sendApi(clientId,{
                        type:"OPEN_ORDER",
                        payload:openOrder
                    })
                }
                catch(e){
                    console.log(e)
            }
        }
    }

    createOrder(market:string,price:string,quantity:string,side:"buy"|"sell",userId:string){
        const orderbook=this.orderbooks.find(o=>o.ticker()===market);
        const baseAsset=market.split('_')[0];
        const quoteAsset=market.split('_')[1];

        if(!orderbook){
            throw new Error('No orderbook found')
        }

        this.checkAndLockFunds(baseAsset,quoteAsset,side,userId,price,quantity);

        const order:Order={
            price:Number(price),
            orderId:Math.random().toString(36).substring(2,15)+Math.random().toString(36).substring(2,15),
            quantity:Number(quantity),
            side:side,
            market:market,
            userId:userId,
            filled:0
        }

        const {fills,executedQty} = orderbook.addOrder(order)

        this.updateBalance(userId,baseAsset,quoteAsset,side,fills,executedQty);
        this.createDbTrade(fills,market,userId);
        this.updateDbOrders(order,executedQty,fills,market)
        this.publishWsDepthUpdates(fills,price,side,market)
        this.publishWsTrades(fills,userId,market)
        return{ executedQty, fills, orderId: order.orderId }
    }

    checkAndLockFunds(baseAsset:string,quoteAsset:string,side:"buy"|"sell",userId:string,price:string,quantity:string){
        if(side==="buy"){
            if((this.balances.get(userId)?.[quoteAsset]?.available||0)<Number(price)*Number(quantity)){
                throw new Error("Insufficient Balance")
            }
            //@ts-ignore
            this.balances.get(userId)?.[quoteAsset]?.available-=(Number(quantity)*Number(price));
            
            //@ts-ignore
            this.balances.get(userId)?.[quoteAsset]?.locked+=(Number(quantity)*Number(price));

        }
        else{
            if((this.balances.get(userId)?.[baseAsset]?.available||0)<Number(quantity)){
                throw new Error("Insufficient funds");
            }

            //@ts-ignore
            this.balances.get(userId)?.[baseAsset]?.available-=Number(quantity)
            //@ts-ignore
            this.balances.get(userId)?.[baseAsset]?.locked+=Number(quantity)
        }
    }

    updateBalance(userId:string,baseAsset:string,quoteAsset:string,side:"buy"|"sell",fills:Fill[],executedQty:number){
        if(side==="buy"){
            fills.forEach((fill)=>{

                //@ts-ignore
                this.balances.get(fill.otherUserId)?.[baseAsset]?.locked-=Number(fill.qty);
                //@ts-ignore
                this.balances.get(fill.otherUserId)?.[quoteAsset]?.available+=Number(fill.qty)*Number(fill.price)

                //@ts-ignore
                this.balances.get(userId)?.[baseAsset]?.available+=Number(fill.qty);
                //@ts-ignore
                this.balances.get(userId)?.[quoteAsset]?.locked-=Number(fill.qty)*Number(fill.price)

            })
        }
        else{
           fills.forEach((fill)=>{
                //@ts-ignore
                this.balances.get(fill.otherUserId)?.[baseAsset]?.available+=Number(fill.qty)

                //@ts-ignore
                this.balances.get(userId)?.[baseAsset]?.locked-=Number(fill.qty)
                //@ts-ignore
                this.balances.get(fill.otherUserId)?.[quoteAsset]?.locked-=Number(fill.qty)*Number(fill.price)

                //@ts-ignore
                this.balances.get(userId)?.[quoteAsset]?.available+=Number(fill.qty)*Number(fill.price)

           })
        }
    }

    publishWsDepthUpdates(fills:Fill[],price:string,side:"buy"|"sell",market:string){
        const orderbook = this.orderbooks.find(o=>o.ticker() === market)
        if(!orderbook){
            return;
        }

        const depth=orderbook.getDepth();

        if(side==="buy"){
            const updatedAsks=depth?.asks.filter(x=>fills.map(f=>f.price).includes(x[0].toString()))
            const updatedBids=depth?.bids.find(x=>x[0]===price)
            console.log("publish bids update")
            RedisManager.getInstance().publishedMessage(`depth@${market}`,{
                stream:`depth@${market}`,
                data:{
                    a: updatedAsks,
                    b:updatedBids? [updatedBids]:[],
                    e:"depth"
                }
            })
        }
        if(side==="sell"){
            const updatedAsks=depth?.asks.find(x=>x[0]===price);
            const updatedBids=depth?.bids.filter(x=>fills.map(f=>f.price).includes(x[0].toString()))
            console.log("publish asks update")
            RedisManager.getInstance().publishedMessage(`depth@${market}`,{
                stream:`depth@${market}`,
                data:{
                    a:updatedAsks?[updatedAsks]:[],
                    b:updatedBids,
                    e:"depth"
                }
            })
        }
    }


    publishWsTrades(fills:Fill[], userId:string, market:string){
        fills.forEach((fill)=>{
            RedisManager.getInstance().publishedMessage(`trade@${market}`,{
                stream:`trade@${market}`,
                data:{
                    e: "trade",
                    t: fill.tradeId,
                    m: fill.otherUserId === userId, // TODO: Is this right?
                    p: fill.price,
                    q: fill.qty.toString(),
                    s: market,
                }
            })
        })
    }

    onRamp(userId:string,amount:number){
        const userBalance=this.balances.get(userId);
        if(!userBalance){
            this.balances.set(userId,{
                [BASE_CURRENCY]:{
                    available:amount,
                    locked:0
                }
            })
        }
        else{
            userBalance[BASE_CURRENCY].available+=amount
        }
    }

    sendUpdatedDepthAt(price: string, market: string) {
        const orderbook = this.orderbooks.find(o => o.ticker() === market);
        if (!orderbook) {
            return;
        }
        const depth = orderbook.getDepth();
        const updatedBids = depth?.bids.filter(x => x[0] === price);
        const updatedAsks = depth?.asks.filter(x => x[0] === price);
        
        RedisManager.getInstance().publishedMessage(`depth@${market}`, {
            stream: `depth@${market}`,
            data: {
                a: updatedAsks.length ? updatedAsks : [[price, "0"]],
                b: updatedBids.length ? updatedBids : [[price, "0"]],
                e: "depth"
            }
        });
    }

    updateDbOrders(order:Order,executedQty:number,fills:Fill[],market:string){
        RedisManager.getInstance().pushMessage({
            type:ORDER_UPDATE,
            data:{
                orderId:order.orderId,
                executedQuantity:executedQty,
                market:market,
                price:order.price.toString(),
                quantity:order.quantity.toString(),
                side:order.side
            }
        })

        fills.forEach((fill)=>{
            RedisManager.getInstance().pushMessage({
                type:ORDER_UPDATE,
                data:{
                    orderId:fill.markerOrderId,
                    executedQuantity:fill.qty
                }
            })
        })
    }

    createDbTrade(fills:Fill[],market:string,userId:string){
        fills.forEach((fill)=>{
            RedisManager.getInstance().pushMessage({
                type:"TRADE_ADDED",
                data:{
                    market:market,
                    id:fill.tradeId.toString(),
                    price:fill.price,
                    quantity:fill.qty.toString(),
                    quotedQuantity:(fill.qty*Number(fill.price)).toString(),
                    isBuyerMaker:fill.otherUserId===userId,
                    timestamp:Date.now()
                }
            })
        })
    }

    setBaseBalance(){
        this.balances.set("1",{
            [BASE_CURRENCY]:{
                available:1000000,
                locked:0
            },
            "TATA":{
                available:1000000,
                locked:0
            }
        })

        this.balances.set("2",{
            [BASE_CURRENCY]:{
                available:100000,
                locked:0
            },
            "TATA": {
                available: 10000000,
                locked: 0
            }
        });

        this.balances.set("5", {
            [BASE_CURRENCY]: {
                available: 10000000,
                locked: 0
            },
            "TATA": {
                available: 10000000,
                locked: 0
            }
        });
    }
}