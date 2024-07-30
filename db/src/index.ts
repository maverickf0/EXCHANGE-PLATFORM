import {Client} from 'pg'
import {createClient} from 'redis'
import { DbMessage } from './types';

const pgClient= new Client({
    user:"postgres",
    host:"localhost",
    port:5432,
    password:"manav@1407",
    database:"my_database"
})

pgClient.connect();

async function main(){
    const redisClient=createClient();
    await redisClient.connect();
    console.log("Connected to redis Client")

    while(true){
        const response=await redisClient.rPop("db_processor" as string);

        if(!response){

        }
        else{
            const data:DbMessage=JSON.parse(response);
            if(data.type === "TRADE_ADDED"){
                console.log("adding data");
                console.log(data);

                const price = data.data.price;
                const timestamp = new Date(data.data.timestamp);
                const query = 'INSERT INTO tata_prices (time, price) VALUES ($1,$2)';
                const values = [timestamp, price];
                await pgClient.query(query,values);
            }
        }
    }
}

main();