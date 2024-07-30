
export type DbMessage={
    type:"TRADE_ADDED",
    data:{
        id:string,
        isBuyerMaker:boolean,
        price:string,
        quantity:string,
        quoteQuantity:string,
        timestamp:number,
        market:string,
    } 
    }  | {
        type:"ORDER_UPDATE",
        data:{
            orderId:string,
            executedQty:number,
            market?:string,
            side?:"buy"|"sell",
            price?:string,
            quantity?:string
        }
    }
