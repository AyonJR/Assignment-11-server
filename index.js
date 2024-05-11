const express = require("express")
const cors = require("cors")
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express() 
require('dotenv').config()
const port = process.env.PORT || 5000 

app.use(cors()) 
app.use(express.json())




const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.4dm99p5.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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
    // await client.connect();\
 
  const queryCollection = client.db('addQueries').collection('queries')


  //allQuery data
  app.get('/queries' , async (req , res )=> {
    const result = await queryCollection.find().sort({_id:-1}).toArray()
    res.send(result)
  })

 
  //query for user 
  app.get('/queries/:email' , async(req,res)=> {
    const email = req.params.email
    const query = {userEmail : email}
    const result = await queryCollection.find(query).sort({_id:-1}).toArray()
    res.send(result)
  })



// adding products 

 app.post('/queries' , async(req , res) => {
    const productsInfo = req.body 
    const result = await queryCollection.insertOne(productsInfo)
    res.send(result)
}) 

 //delete myQuery 

 app.delete('/query/:id' , async(req , res)=> {
    const id = req.params.id 
    const query = { _id : new ObjectId(id)}
    const result = await queryCollection.deleteOne(query)
    res.send(result)
 })




    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);








app.get("/" , (req , res)=> {
    res.send("assignment is going on")
}
 ) 

 app.listen(port , ()=> {
    console.log(`assignment server is running on the port: ${port}`)
 })