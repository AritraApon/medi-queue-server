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
    const bookingCollection = db.collection('bookings')


    //    Add tutor POST

    app.post('/tutors', async (req, res) => {
      const newTutor = req.body;
      // console.log(newTutor)
      const result = await tutorCollection.insertOne(newTutor)
      res.send(result)

    })

    //get all api
    app.get('/tutors', async (req, res) => {
      const search = req.query.search;
      let query = {};
      if (search) {
        query = {
          tutorName: {
            $regex: search,
            $options: 'i'
          }
        };
      }
      const cursor = tutorCollection.find(query)
      const result = await cursor.toArray();
      res.send(result);
    });

    // get home page 6 info api
    app.get('/six-tutors', async (req, res) => {
      const cursor = tutorCollection.find().limit(6)
      const result = await cursor.toArray();
      res.send(result);
    });
    // get tutor details data

    app.get('/tutors/:id', async (req, res) => {
      const id = req.params.id
      const query = {
        _id: new ObjectId(id)
      }
      const result = await tutorCollection.findOne(query)

      res.send(result)
    })


    // my tutor api
    app.get('/my-tutors', async (req, res) => {
      try {
        const email = req.query.email;


        if (!email || email === "undefined") {
          return res.status(400).send({ message: "Email is missing or invalid" });
        }

        const query = { userEmail: email };
        const result = await tutorCollection.find(query).toArray();
        res.send(result);
      } catch (error) {
        console.error("Backend Error:", error);
        res.status(500).send({ message: "Database error occurred" });
      }
    });


    // my tutor data update
    app.patch('/tutors/:id', async (req, res) => {
      try {
        const id = req.params.id;
        const filter = { _id: new ObjectId(id) };
        const modifiedUser = req.body;

        const updateDocument = {
          $set: {
            tutorName: modifiedUser.tutorName,
            photo: modifiedUser.photo,
            subject: modifiedUser.subject,
            teachingMode: modifiedUser.teachingMode,
            availableDays: modifiedUser.availableDays,
            availableTime: modifiedUser.availableTime,
            hourlyFee: modifiedUser.hourlyFee,
            totalSlot: modifiedUser.totalSlot,
            sessionDate: modifiedUser.sessionDate,
            location: modifiedUser.location,
            experience: modifiedUser.experience,
          }
        };

        const result = await tutorCollection.updateOne(filter, updateDocument);

        if (result.modifiedCount > 0) {
          res.send(result);
        } else {
          res.status(404).send({ message: "No changes made or tutor not found" });
        }
      } catch (error) {
        console.error("Update Error:", error);
        res.status(500).send({ message: "Internal Server Error" });
      }
    });




    // my tutors data delete

    app.delete('/tutors/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await tutorCollection.deleteOne(query)
      res.send(result)
    })



    // bookings data post
    app.post('/bookings', async (req, res) => {
      try {
        const bookingData = req.body;
        const tutorId = bookingData.tutorId;
        const query = { _id: new ObjectId(tutorId) };

        const tutor = await tutorCollection.findOne(query);
        if (!tutor) {
          return res.status(404).send({ message: "Tutor not found!" });
        }
        const currentSlots = parseInt(tutor.totalSlot);
        if (currentSlots <= 0) {
          return res.status(400).send({ message: "No available slots left." });
        }
        const bookingResult = await bookingCollection.insertOne(bookingData);
        const updateTutor = await tutorCollection.updateOne(
          { _id: new ObjectId(tutorId) },
          { $set: { totalSlot: (currentSlots - 1).toString() } }
        );
        res.send({ bookingResult, updateTutor });

      } catch (error) {
        console.error(error);
        res.status(500).send({ message: "Internal Server Error" });
      }
    });
    //  get my booking tutors
    app.get('/my-bookings/:userId', async (req, res) => {
      const userId = req.params.userId;
      const query = { studentId: userId };
      const result = await bookingCollection.find(query).toArray();
      res.send(result);
    });


    // update booking data
    app.patch('/bookings/:id', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const update = {
        $set:
        {
          status: 'Cancelled'

        }
      };

      const booking = await bookingCollection.findOne(filter);
      const result = await bookingCollection.updateOne(filter, update);

      if (result.modifiedCount > 0 && booking?.tutorId) {
        const tutor = await tutorCollection.findOne({ _id: new ObjectId(booking.tutorId) });
        if (tutor) {
          const newSlots = (parseInt(tutor.totalSlot) + 1).toString();
          await tutorCollection.updateOne(
            { _id: new ObjectId(booking.tutorId) },
            { $set: { totalSlot: newSlots } }
          );
        }
      }

      res.send(result);
    });


    app.get('/bookings', async (req, res) => {
      const cursor = bookingCollection.find()
      const result = await cursor.toArray();
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
