export const CREATE_ORDER="CREATE_ORDER"
export const CANCEL_ORDER="CANCEL_ORDER"
export const GET_OPEN_ORDERS="GET_OPEN_ORDERS"
export const GET_DEPTH="GET_DEPTH"
export const ON_RAMP="ON_RAMP"

export type MessageFromOrderBook={
    type:"DEPTH",
    payload:{
            market:string,
            bids:[string,string[]],
            asks:[string,string[]],
        }
    }
    |
    {
        type:"ORDER_PLACED",
        payload:{
            orderId:string,
            executedQty:number,
            fill:[
                {
                    price:string,
                    qty:string,
                    tradeId:string
                }
            ]
        }
    }|{
        type:"ORDER_CANCELLED",
        payload:{
            orderId:string,
            executedQty:number,
            remainingQty:number
        }
    }|{
        type:"OPEN_ORDER",
        payload:{
            orderId:string,
            executedQty:number,
            price:string,
            quantity:string,
            side:"buy"|"sell"
            userId:string
        }
    }[]