const express = require("express");
const cors=require("cors");
require('dotenv').config()
const { MongoClient, ServerApiVersion } = require('mongodb');
const app=express();
const port = process.env.PORT || 5000;

//middlewares
app.use(cors())
app.use(express.json());

//name=BookEase
//password=VLJISvdpRGrH0225


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.wy4ghoc.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    await client.connect();
    

    
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    //await client.close();
  }
}
run().catch(console.dir);


app.get('/',(req,res) => {
    res.send('doctor is running!');
})

app.listen(port, () =>{
    console.log(`car doctor is running on port : ${port}`);
})