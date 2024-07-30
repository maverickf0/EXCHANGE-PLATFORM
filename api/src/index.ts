import express from 'express'
import cors from 'cors'
import { orderRoute } from './Routes/orderRoute';
import { depthRouter } from './Routes/depthRoute';
import { tradesRouter } from './Routes/tradeRoute';
import { tickersRouter } from './Routes/tickerRoute';
import { klineRoute } from './Routes/klinesRoute';

const app=express();

app.use(express.json());
app.use(cors());


//use to fetch the order routes

app.use('/api/v1/order',orderRoute)
app.use('api/v1/depth',depthRouter)
app.use('/api/v1/trade',tradesRouter)
app.use('/api/v1/ticker',tickersRouter)
app.use('/api/v1/klines',klineRoute)
app.listen(3000,()=>{
    console.log('connection oriented')
})