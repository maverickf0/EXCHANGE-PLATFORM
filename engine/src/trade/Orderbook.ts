import { BASE_CURRENCY } from "./Engine";


export interface Order{
    price:number,
    orderId:string,
    quantity:number,
    market:string,
    filled:number,
    side:'buy'|'sell',
    userId:string
}

export interface Fill{
    price:string,
    qty:number,
    tradeId:number,
    otherUserId:string,
    markerOrderId:string
}

export class Orderbook{
    bids:Order[];
    asks:Order[];
    baseAsset:string;
    quoteAsset:string = BASE_CURRENCY ;
    lastTradeId:number;
    currentPrice:number;

    constructor(baseAsset:string, bids:Order[],asks:Order[],lastTradeId:number,currentPrice:number){
        this.bids=bids;
        this.asks=asks;
        this.baseAsset=baseAsset;
        this.lastTradeId=lastTradeId;
        this.currentPrice=currentPrice;
    }

    ticker(){
        return `${this.baseAsset}_${this.quoteAsset}`;
    }

    getSnapShot(){
        return{
            baseAsset:this.baseAsset,
            bids:this.bids,
            asks:this.asks,
            lastTradeId:this.lastTradeId,
            currentPrice:this.currentPrice
        }
    }

    addOrder(order:Order):{executedQty:number,fills:Fill[]}{
        if(order.side=="buy"){
            const {executedQty,fills}=this.matchBid(order);
            order.filled=executedQty;
            if(executedQty === order.quantity){
                return{
                    executedQty,
                    fills
                }
            }
            this.bids.push(order);
            return{
                executedQty,
                fills
            }
        }else{
            const {executedQty,fills}=this.matchAsks(order);
            order.filled=executedQty;
            if(executedQty===order.quantity){
                return{
                    executedQty,
                    fills
                }
            }
            this.asks.push(order);
            return{
                executedQty,
                fills
            }
        }
    }

    matchBid(order:Order):{executedQty:number,fills:Fill[]}{
        const fills:Fill[]=[];
        let executedQty=0;

        this.asks.sort((a,b)=>((a.price<b.price)?1:-1));
//TODO:check weather i need to reduce asks.quantity after order
        for(let i=0;i<this.asks.length;i++){
            if(executedQty===order.quantity)break;
            if(this.asks[i].price<=order.price){
                const filledQty = Math.min(this.asks[i].quantity,(order.quantity-executedQty));
                executedQty+=filledQty;
                this.asks[i].filled+=filledQty;
                fills.push({
                    price: this.asks[i].price.toString(),
                    qty:filledQty,
                    tradeId:this.lastTradeId++,
                    otherUserId:this.asks[i].userId,
                    markerOrderId:this.asks[i].orderId
                })
            }
        }
        for(let i=0;i<this.asks.length;i++){
            if(this.asks[i].filled === this.asks[i].quantity){
                this.asks.splice(i,1);
                i--;
            }
        }
        return{
            fills,
            executedQty
        }
    }

    matchAsks(order:Order){
        const fills:Fill[]=[];
        let executedQty=0;

        for(let i=0;i<this.bids.length;i++){
            if(executedQty===order.quantity)break;
            if(this.bids[i].price>=order.price){
                const filledQty=Math.min(this.bids[i].quantity,(order.quantity-executedQty));
                executedQty+=filledQty;
                this.bids[i].filled=filledQty
                fills.push({
                    price:this.bids[i].price.toString(),
                    qty:filledQty,
                    tradeId:this.lastTradeId++,
                    otherUserId:this.bids[i].userId,
                    markerOrderId:this.bids[i].orderId
                })
            }
        }
        for(let i=0;i<this.bids.length;i++){
            if(this.bids[i].filled===this.bids[i].quantity){
                this.bids.splice(i,1);
                i--;
            }
        }

        return{
            executedQty,
            fills
        }
    }
    getDepth(){
        const bids:[string,string][]=[]
        const asks:[string,string][]=[]

        const bidsObj:{[key:string]:number}={}
        const asksObj:{[key:string]:number}={}

        for(let i=0;i<this.bids.length;i++){
            const order=this.bids[i];
            if(!bidsObj[order.price]){
                bidsObj[order.price]=0;
            }
            bidsObj[order.price]+=order.quantity;
        }

        for(let i=0;i<this.asks.length;i++){
            const order=this.asks[i];
            if(!asksObj[order.price]){
                asksObj[order.price]=0;
            }
            asksObj[order.price]+=order.quantity;
        }

        for(const price in bidsObj){
            bids.push([price,bidsObj[price].toString()])
        }

        for(const price in asksObj){
            asks.push([price,asksObj[price].toString()])
        }

        return{
            asks,
            bids
        }
    }

    getOpenOrders(userId:string){
        const bids=this.bids.filter((o)=>o.userId===userId);
        const asks=this.asks.filter((o)=>o.userId===userId);
        return[...asks,...bids];
    }

    cancelBids(order:Order){
        const index=this.bids.findIndex((o)=>o.orderId===order.orderId)
        if(index!==-1){
            const price=this.bids[index].price;
            this.bids.splice(index,1);
            return price;
        }
    }

    cancelAsk(order: Order) {
        const index = this.asks.findIndex(x => x.orderId === order.orderId);
        if (index !== -1) {
            const price = this.asks[index].price;
            this.asks.splice(index, 1);
            return price
        }
    }

}

