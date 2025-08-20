import express from 'express';
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const app = express() ;

const masterPool = new Pool({
    connectionString : process.env.MASTER_DB ,
})

// app.get("/write", async (req, res) => {
//     const start = Date.now();
//     await pool.query("INSERT INTO bench (data) VALUES ($1)", [Math.random().toString()]);
//     res.send(
//         { 
//             action: "write", 
//             time: Date.now() - start 
//         }
//     );
// });  


// app.get("/read", async (req, res) => {
//     const start = Date.now();
//     const result = await pool.query("SELECT * FROM bench ORDER BY id DESC LIMIT 10");
//     res.send(
//         {
//             action: "read", 
//             time: Date.now() - start, 
//             rows: result.rows 
//         }
//     );
// });


const replicaPools = [
    new Pool({ connectionString: process.env.REPLICA_DB_1 }),
    new Pool({ connectionString: process.env.REPLICA_DB_2 })
];

let currentReplicaIndex = 0;

app.get("/write", async (req, res) => {
    const start = Date.now();
    // console.log("writing into master");
    await masterPool.query("INSERT INTO bench (data) VALUES ($1)", [Math.random().toString()]);
    res.send(
        { 
            action: "write", 
            time: Date.now() - start 
        }
    );
});

app.get("/read", async (req, res) => {
    const start = Date.now();
    const replicaPool = replicaPools[currentReplicaIndex];
    // const replicaNumber = currentReplicaIndex + 1;
    currentReplicaIndex = (currentReplicaIndex + 1) % replicaPools.length;
    
    // console.log(`Reading from replica ${replicaNumber}`);
    const result = await replicaPool.query("SELECT * FROM bench ORDER BY id DESC LIMIT 10");
    
    res.send(
        {
            action: "read", 
            time: Date.now() - start, 
            rows: result.rows,
            replica_used: `replica_${replicaNumber}`
        }
    );
});


app.listen(3000 , () => {
    console.log("Server is running on port 3000");
})