import { createClient } from "redis";
import { Engine } from "./trade/Engine";

async function main(){

    const engine=new Engine();
    const redisClient=createClient();
    redisClient.connect();
    console.log("connected to redis client")
    
    while(true){
        const response=await redisClient.rPop("messages" as string)

        if(!response){
            return;
        }
        else{
            engine.process(JSON.parse(response))
        }
    }

}

main();