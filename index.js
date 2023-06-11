const express = require("express");
require('dotenv').config();
const app = express();
const cors = require("cors");
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

const { MongoClient, ServerApiVersion } = require('mongodb');
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

    // Fetch selected class data by specific student 
    app.get("/selected-classes", async (req, res)=> {
      let query = {};
      if (req.query?.email) {
        query = { addedBy : req.query.email }
        }
        console.log(query);
        const result = await selectedClassesCollection.find(query).toArray();
        res.send(result);
    })

    // Insert Registered User Data 
    app.post('/users', async (req, res) => {
      const user = req.body;
      const result = await usersCollection.insertOne(user);
      res.send(result);
    });

    // Insert Selected Class Data by Students
    app.post("/selected-class", async (req, res) => {
      const selectedClass = req.body;
      const result = await selectedClassesCollection.insertOne(selectedClass);
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