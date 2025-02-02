const express = require("express")
const cors = require("cors")
const jwt = require("jsonwebtoken")
const cookieParser = require("cookie-parser")
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express()
require('dotenv').config()
const port = process.env.PORT || 5000

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://final-assignment-11.web.app",
      "https://final-assignment-11.firebaseapp.com"

    ],
    credentials: true,
  })
);
app.use(express.json())
app.use(cookieParser())




const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.4dm99p5.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

//middlewares 

const logger = (req, res, next)=> {
  console.log( 'log info:' ,req.method , req.url);
  next()
}


const verifyToken = (req, res, next)=> {
  const token = req?.cookies?.token
  // console.log('token in the middleware', token)
  // no token available
  if(!token){
    return res.status(401).send({message : 'unauthorized access'})
  }
  // next()
  jwt.verify(token , process.env.ACCESS_TOKEN_SECRET , (err , decoded)=>{
    if(err){
      return res.status(401).send({message:'unauthorized access'})
    }
    req.user = decoded ; 
    next()
  })
}


const cookieOption = {

  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
} ;




async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    const queryCollection = client.db('addQueries').collection('queries')
    const recommendCollection = client.db('addQueries').collection('recommendations')



    //  json webtoken 
    app.post('/jwt', async (req, res) => {
      const user = req.body
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: '7d'
      })

      res.cookie('token', token, cookieOption )
      res.send({ success: true })
    })

 // for removing cookie after log out

  
 app.post('/logout' , async(req ,res)=> {
   const user = req.body 
   console.log('logging out' , user)
   res.clearCookie('token' , {...cookieOption , maxAge:0}).send({success:true})
 })




    //homepage cards 

    app.get('/queries', async (req, res) => {
      const result = await queryCollection.find().sort({ _id: -1 }).toArray()
      res.send(result)
    })




    //allQuery data
    app.get('/queries', async (req, res) => {
      const result = await queryCollection.find().sort({ _id: -1 }).toArray()
      res.send(result)
    })


    //query for user 
    app.get('/queries/:email', logger , verifyToken , async (req, res) => {
      const email = req.params.email
      // console.log('queries' , req.cookies)
      if(req.user.email !== email){
        return res.status(403).send({message: 'forbidden access'})
      }
      const query = { userEmail: email }
      const result = await queryCollection.find(query).sort({ _id: -1 }).toArray()
      res.send(result)
    })

    //details 
    app.get('/query/:id', async (req, res) => {
      const id = req.params.id
      const query = { _id: new ObjectId(id) }
      const result = await queryCollection.findOne(query)
      res.send(result)
    })

    //My recommendations 

    // ----------------------------------------------------------------

    // app.get('/allRecommendations/:queryId' , async(req,res)=>{
    //   const id = req.params.queryId
    //   console.log(id)
    //    const query = { queryId : id}
    //    const result = await recommendCollection.find(query).toArray()
    //    console.log(result)
    //    res.send(result)
    // })

  //   app.get('/allRecommendations/:queryId', async (req, res) => {
  //     try {
  //         const queryId = req.params.queryId;
  //         const query = { queryId: new ObjectId(queryId) };
  //         const result = await recommendCollection.find(query).toArray();
  //         console.log(result);
  //         res.send(result);
  //     } catch (error) {
  //         console.error('Error fetching recommendations:', error);
  //         res.status(500).json({ error: 'Internal server error' });
  //     }
  // });
  


  app.get('/allRecommendations/:queryId', async (req, res) => {
    const id = req.params.queryId;
    console.log(id);
    const query = { queryId: id };
    const result = await recommendCollection.find(query).toArray();
    console.log(result);
    res.send(result);
});









    // -----------------------------------------------------------------
    app.get('/recommendations/:email', async (req, res) => {
      const email = req.params.email
      const query = { loggedInUserEmail: email }
      const result = await recommendCollection.find(query).sort({ _id: -1 }).toArray()
      res.send(result)
    })

    //Recommendations for me

    app.get('/recommendation/:email', async (req, res) => {
      const email = req.params.email
      const query = { userEmail: email }
      const result = await recommendCollection.find(query).sort({ _id: -1 }).toArray()
      res.send(result)
    })

    // get operation for update
    app.get('/queryUpdate/:id', async (req, res) => {
      const id = req.params.id
      const query = { _id: new ObjectId(id) }
      const result = await queryCollection.findOne(query)
      res.send(result)
    })

   // get operation for all recommendations
  




   // show the recommendations for that query

  //  app.get('/recommendations/:id', async (req, res) => {
  //   const id = req.params.id
  //   const query = { _id: new ObjectId(id) }
  //   const result = await recommendCollection.find(query).sort({ _id: -1 }).toArray()
  //   res.send(result)
  // })




    //PUT operation for update

    app.put('/queries/:id', async (req, res) => {
      const id = req.params.id
      const filter = { _id: new ObjectId(id) }
      const options = { upsert: true }
      const updatedQuery = req.body
      const newQuery = {
        $set: {

          productName: updatedQuery.productName,
          productBrand: updatedQuery.productBrand,
          imageUrl: updatedQuery.imageUrl,
          queryTitle: updatedQuery.queryTitle,
          boycottingReason: updatedQuery.boycottingReason,
        }
      }

      const result = await queryCollection.updateOne(filter, newQuery, options)
      res.send(result)
    })






    // adding products 

    app.post('/queries', async (req, res) => {
      const productsInfo = req.body
      const result = await queryCollection.insertOne(productsInfo)
      res.send(result)
    })

    // recommendation 

    app.post('/recommendations', async (req, res) => {
      const recommend = req.body;
      console.log(recommend)
      const result = await recommendCollection.insertOne(recommend)
    
      //update recommend count in query collection
       const updateDoc = {
       $inc: {recommendation : 1  } ,
    }
    const recommendationQuery =  { _id : new ObjectId(recommend.queryId)} 

    const updateRecommendOne = await queryCollection.updateOne(  recommendationQuery , updateDoc)
    console.log(updateRecommendOne)

      res.send(result)
    })



    //delete my recommendations


    app.delete('/recommendations/:id', async (req, res) => {
      try {
        // const recommend = req.body;
          
          const id = req.params.id;
          // const queryId = req.params.queryId ;
          console.log(req.body , 1) 
          const query = { _id: new ObjectId(id) };
          
          const recommendation = await recommendCollection.findOne(query);
          console.log(recommendation , 2)


          // Delete the recommendation
           const result = await recommendCollection.deleteOne(query);
          // console.log(result);
          const updateDoc = {
            $inc: {recommendation : -1 } ,
         }
         const recommendationQuery = { _id : new ObjectId(recommendation.queryId)} 
     
         const updateRecommendTwo = await queryCollection.updateOne( recommendationQuery , updateDoc)
         console.log(updateRecommendTwo , 3)
  // ---------------------------------------------------
          // Decrement the recommendation count in the corresponding query
         
  
          res.send(result);
          // res.send(updateRecommend)

      } catch (error) {
          console.error(error);
          res.status(500).json({ error: 'Internal server error' });
      }
  });
  


    //delete myQuery 

    app.delete('/query/:id', async (req, res) => {
      const id = req.params.id
      const query = { _id: new ObjectId(id) }
      const result = await queryCollection.deleteOne(query)
      res.send(result)
    })







    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);








app.get("/", (req, res) => {
  res.send("assignment is going on")
}
)

app.listen(port, () => {
  console.log(`assignment server is running on the port: ${port}`)
})