const express = require("express");
const cors=require("cors");
const jwt=require('jsonwebtoken');
require('dotenv').config()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cookieParser = require("cookie-parser");
const app=express();
const port = process.env.PORT || 5000;

//middlewares
const allowedOrigins = ['http://localhost:5173'];
app.use(cors({
  origin: function(origin, callback) {
    // Check if the origin is allowed or if it's a request from a trusted origin (e.g., not a malicious request)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials:true
}))
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:5173'); // Allow requests from this origin
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Credentials', 'true'); // Allow credentials (cookies)
  next();
});
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));



const verifyToken = (req,res,next) =>{
  const token = req.cookies?.token; 
  if(!token){
    return res.status(401).send({message: 'Unauthorizrd access'});
  }
  jwt.verify(token,process.env.ACCESS_TOKEN,(err,decoded) =>{
    if(err){
      return res.status(401).send({message:'unauthorized access'});
    }
    req.user=decoded;
    next();
  }) 
}


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

app.post('/jwt',async(req,res) =>{
  const user=req.body;
  const token = jwt.sign(user,process.env.ACCESS_TOKEN,{expiresIn:'20h'});
  res.cookie('token',token,{
    httpOnly:true,
    secure:true,
    sameSite:'none'
  }).send({success:true});
})

app.post('/logout',async(req,res) =>{
  const user=res.body;
  res.clearCookie('token',{maxAge:0}).send({success:true});
})

app.post('/booking', async(req,res)=>{
  const newSpot=req.body;
  const result = await booking.insertOne(newSpot);
  res.send(result); 
})

app.get('/booking',verifyToken, async(req,res) =>{
  const cursor=booking.find();
  const book = await cursor.toArray();
  res.send(book);
})

app.put('/rooms/:id',verifyToken,async(req,res)=>{
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

app.get('/booking/:email',verifyToken, async (req, res) => {
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


app.put('/booking/:id',verifyToken, async (req, res) => {
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


app.delete('/booking/:id',verifyToken,async(req,res)=>{
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