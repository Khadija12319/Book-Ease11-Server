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

app.get('/booking', async(req,res) =>{
  const cursor=booking.find();
  const book = await cursor.toArray();
  res.send(book);
})

app.put('/rooms/:id',async(req,res)=>{
  const id=req.params.id;
  const filter = {_id: new ObjectId(id)};
  const options = { upsert: true };
  const updatedstatus =req.body;
  const spot = {
      $set: {
          availability:updatedstatus.availability,
          rating:updatedstatus.rating
      }
  }
  const result = await roomsdata.updateOne(filter,spot,options);
  res.send(result);
})

app.get('/booking/:email', async (req, res) => {
  const userEmail = req.params.email;
  const result = await booking.find({ email: userEmail }).toArray();
  res.send(result);
});


app.get('/ratings', async (req, res) => {
  const cursor = roomsdata.aggregate([
      {
          $match: {
              'rating.rate': { $exists: true, $gte: 0 }
          }
      },
      {
          $project: {
              _id: 0,
              ratings: '$rating'
          }
      },
      {
        $unwind: '$ratings' // Unwind the ratings array
      },
      {
        $sort: { 'ratings.time': -1 } // Sort ratings in descending order by rate
      }
  ]);

  const result = await cursor.toArray();
  const ratings = result.map(room => room.ratings).flat(); // Extract and flatten ratings from each room

  res.send(ratings);
});


app.put('/booking/:id', async (req, res) => {
  const id = req.params.id;
  const filter = { _id: new ObjectId(id) };
  const options = { upsert: true };
  const updatedStatus = req.body; // Changed variable name to updatedStatus
  const bookingUpdate = {
    $set: {
      sdate: updatedStatus.sdate,
      edate: updatedStatus.edate,
      rating:updatedStatus.rating
    }
  };
  const result = await booking.updateOne(filter, bookingUpdate, options); // Changed variable name to bookingUpdate
  res.send(result);
});


app.delete('/booking/:id',async(req,res)=>{
  const id=req.params.id;
  const query={_id: new ObjectId(id)};
  const books=await booking.deleteOne(query);
  res.send(books);
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