"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.orderRoute = void 0;
const express_1 = require("express");
const RedisManager_1 = require("../RedisManager");
const types_1 = require("../types");
exports.orderRoute = (0, express_1.Router)();
exports.orderRoute.post('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const parsedBody = req.body;
    const { market, price, quantity, side, userId } = parsedBody;
    console.log(market, price, quantity, side, userId);
    const response = yield RedisManager_1.RedisManager.getInstance().sendAndAwait({
        type: types_1.CREATE_ORDER,
        data: {
            market,
            price,
            quantity,
            side,
            userId
        }
    });
    res.json(response.payload);
}));
exports.orderRoute.delete('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { orderId, market } = req.body;
    const response = yield RedisManager_1.RedisManager.getInstance().sendAndAwait({
        type: types_1.CANCEL_ORDER,
        data: {
            orderId,
            market
        }
    });
    res.json(response.payload);
}));
exports.orderRoute.get('/open', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const response = yield RedisManager_1.RedisManager.getInstance().sendAndAwait({
        type: types_1.GET_OPEN_ORDERS,
        data: {
            userId: req.query.userId,
            market: req.query.market
        }
    });
    res.json(response.payload);
}));
