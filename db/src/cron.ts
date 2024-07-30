import { Client } from "pg";


const client = new Client({
    user:'postgres',
    host:'localhost',
    port:5432,
    database:'my_database',
    password:'manav@1407'
})

client.connect();

async function refreshView() {
    await client.query(`REFRESH MATERIALIZED VIEW klines_1m`)
    await client.query(`REFRESH MATERIALIZED VIEW klines_1h`)
    await client.query(`REFRESH MATERIALIZED VIEW klines_1w`)

    console.log("Materialized views refreshed successfully")
}

refreshView().catch(console.error);

setInterval(()=>{
    refreshView();
},1000 * 10)