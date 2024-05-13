const express = require("express");
const cors=require("cors");
require('dotenv').config()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app=express();
const port = process.env.PORT || 5000;

//middlewares
app.use(cors())
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


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

    const roomsdata=client.db('Hotel').collection('BookEase');
    const booking = client.db('Hotel').collection('Booking');

    app.get('/rooms', async(req,res) =>{
        const cursor=roomsdata.find();
        const spots = await cursor.toArray();
        res.send(spots);
    })

    app.get('/rooms/:id',async(req,res)=>{
        const id=req.params.id;
        const query={_id: new ObjectId(id)};
        const room=await roomsdata.findOne(query);
        res.send(room);
    })

    app.get('/lthundred', async(req, res) => { 
        const cursor = roomsdata.find({price: {$lte: 100}});
        const rooms = await cursor.toArray();
        console.log(rooms);
        res.send(rooms);
    });

    app.get('/gthundred', async(req, res) => { 
      const cursor = roomsdata.find({ price: { $gte: 100, $lte: 200 } });
      const rooms = await cursor.toArray();
      console.log(rooms);
      res.send(rooms);
  });

  app.get('/twohundred', async(req, res) => { 
    const cursor = roomsdata.find({ price: { $gte: 200} });
    const rooms = await cursor.toArray();
    console.log(rooms);
    res.send(rooms);
});

app.post('/booking', async(req,res)=>{
  const newSpot=req.body;
  const result = await booking.insertOne(newSpot);
  res.send(result); 
})
    

    
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    //await client.close();
  }
}
run().catch(console.dir);


app.get('/',(req,res) => {
    res.send('server is running!');
})

app.listen(port, () =>{
    console.log(`Server is running on port : ${port}`);
})