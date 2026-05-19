const express = require('express')
const dotenv = require('dotenv')
const cors = require('cors')
dotenv.config()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express()
const uri = process.env.MONGO_URI;
const port = process.env.PORT

app.use(express.json())
app.use(cors())

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});



async function run() {

  try {
 //Collections
   const db = client.db('mediQueueDB');
   const tutorCollection = db.collection('tutors')


//    Add tutor POST

   app.post('/tutors' , async(req ,res) =>{
    const newTutor = req.body;
   console.log(newTutor)
    const result = await  tutorCollection.insertOne(newTutor)
    res.send(result)

   }  )

//get post
app.get('/tutors',async (req, res) => {
  const cursor = tutorCollection.find()
  const result = await cursor.toArray();
  res.send(result);
});

app.get('/tutors/:id', async(req,res)=>{
  const id = req.params.id
  const query = {
    _id: new ObjectId(id)
  }
  const result = await tutorCollection.findOne(query)

  res.send(result)
})

app.get('/my-tutors', async (req, res) => {
    const email = req.query.email;
    const query = { userEmail: email };
    const result = await tutorCollection.find(query).toArray();
    res.send(result);
});


    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
