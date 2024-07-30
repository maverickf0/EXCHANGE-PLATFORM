import { WebSocketServer } from "ws";
import { UserMananger } from "./UserManager";

const wss=new WebSocketServer({port:3001})

wss.on('connection',(ws)=>{
    UserMananger.getInstance().addUser(ws);
})