import { Router } from "express";
import { RedisManager } from "../RedisManager";
import { CANCEL_ORDER, CREATE_ORDER, GET_OPEN_ORDERS } from "../types";

export const orderRoute=Router();

interface CreationTypesInterface{
    market: string,
    price:string,
    quantity:string,
    side:"buy"|"sell",
    userId:string
}


orderRoute.post('/',async(req,res)=>{
    const parsedBody:CreationTypesInterface=req.body
    const {market, price, quantity, side, userId}=parsedBody;
    console.log(market,price,quantity,side, userId)

    const response=await RedisManager.getInstance().sendAndAwait({
        type:CREATE_ORDER,
        data:{
            market,
            price,
            quantity,
            side,
            userId
        }
    })

    res.json(response.payload)
    
})

orderRoute.delete('/',async (req,res)=>{
    const {orderId,market}:{orderId:string, market:string}=req.body

    const response=await RedisManager.getInstance().sendAndAwait({
        type:CANCEL_ORDER,
        data:{
            orderId,
            market
        }
    })

    res.json(response.payload)

})

orderRoute.get('/open',async (req,res)=>{
    const response = await RedisManager.getInstance().sendAndAwait({
        type: GET_OPEN_ORDERS,
        data: {
            userId: req.query.userId as string,
            market: req.query.market as string
        }
    });
    res.json(response.payload);
})