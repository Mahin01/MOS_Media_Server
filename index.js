const express = require("express");
require('dotenv').config();
const app = express();
const cors = require("cors");
const jwt = require('jsonwebtoken');
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

const verifyJWT = (req, res, next) => {
  const authorization = req.headers.authorization;
  if (!authorization) {
    return res.status(401).send({ error: true, message: 'unauthorized access' });
  }
  // bearer token
  const token = authorization.split(' ')[1];

  jwt.verify(token, process.env.SECRET_ACCESS_TOKEN, (err, decoded) => {
    if (err) {
      return res.status(401).send({ error: true, message: 'unauthorized access' })
    }
    req.decoded = decoded;
    next();
  })
}

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.hcrmfrb.mongodb.net/?retryWrites=true&w=majority`;
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
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const usersCollection = client.db("mos-media").collection("users");
    const selectedClassesCollection = client.db("mos-media").collection("selected-class");
    const allClassesCollection = client.db("mos-media").collection("Classes");


    app.post('/jwt', (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.SECRET_ACCESS_TOKEN, { expiresIn: '1h' })
      res.send({ token })
    })

    //Api for fetch all users
    app.get("/users", async(req, res) => {
      const result = await usersCollection.find().toArray();
      res.send(result);
    });

     // API for getting Specific instructor classes
     app.get("/classes", async (req, res) => {
      let query = {};
      if (req.query?.email) {
        query = { InstructorEmail: req.query.email };
      }
      console.log(query);
      const result = await allClassesCollection.find(query).toArray();
      res.send(result);
    });   

    // API for fetching All classes
    app.get("/classes", async(req, res) => {
      const result = await allClassesCollection.find().toArray();
      res.send(result);
    })

    // Fetch selected class data by specific student 
    app.get("/selected-classes", async (req, res)=> {
      let query = {};
      if (req.query?.email) {
        query = { addedBy : req.query.email }
        }
        const result = await selectedClassesCollection.find(query).toArray();
        res.send(result);
    }) 

    // Insert Registered User Data 
    app.post('/users', async (req, res) => {
      const user = req.body;
      const result = await usersCollection.insertOne(user);
      res.send(result);
    });

    // Insert Add Class data to database by instructor
    app.post("/classes", async(req, res) => {
      const singleClass = req.body;
      const result = await allClassesCollection.insertOne(singleClass);
      res.send(result);
    })

    // Insert Selected Class Data by Students
    app.post("/selected-class", async (req, res) => {
      const selectedClass = req.body;
      const result = await selectedClassesCollection.insertOne(selectedClass);
      res.send(result);
    })

    // Api for delete user data by admin from database
    app.delete("/users/:id", async(req, res) => {
      const id = req.params.id;
      const query = {_id : new ObjectId(id)};
      const result = await usersCollection.deleteOne(query);
      res.send(result);
    })

    // Delete Class API For deleting single class from classes collection
    app.delete("/classes/:id", async(req, res) => {
      const id = req.params.id;
      const query = {_id : new ObjectId(id)};
      const result = await allClassesCollection.deleteOne(query);
      res.send(result);
    })

    // Delete class from My selected class on student dashboard upon clicking the delete button
    app.delete("/selected-class/:id", async(req, res) => {
      const id = req.params.id;
      const query = { _id : new ObjectId(id)};
      const result = await selectedClassesCollection.deleteOne(query);
      res.send(result);
    })

    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Mos Media Server is Running");
});

app.listen(port, () => {
  console.log(`Mos Media Server is running on port: ${port}`);
});