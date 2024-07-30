"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const orderRoute_1 = require("./Routes/orderRoute");
const depthRoute_1 = require("./Routes/depthRoute");
const tradeRoute_1 = require("./Routes/tradeRoute");
const tickerRoute_1 = require("./Routes/tickerRoute");
const klinesRoute_1 = require("./Routes/klinesRoute");
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use((0, cors_1.default)());
app.use('/api/v1/order', orderRoute_1.orderRoute);
app.use('api/v1/depth', depthRoute_1.depthRouter);
app.use('/api/v1/trade', tradeRoute_1.tradesRouter);
app.use('/api/v1/ticker', tickerRoute_1.tickersRouter);
app.use('/api/v1/klines', klinesRoute_1.klineRoute);
app.listen(3000, () => {
    console.log('connection oriented');
});
