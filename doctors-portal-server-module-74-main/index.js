const express = require("express");
var jwt = require("jsonwebtoken");
const cors = require("cors");
const { MongoClient, ServerApiVersion } = require("mongodb");
require("dotenv").config();
const port = process.env.PORT || 5000;

const app = express();

// middleware
app.use(cors());
app.use(express.json());

const uri =
  "mongodb+srv://doctor:04L7ENsFSye2zWR5@cluster0.ga4zxwv.mongodb.net/?retryWrites=true&w=majority";

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1
});

async function run() {
  try {
    const appointmentOptionCollection = client
      .db("doctorsPortal1")
      .collection("appointmentOptions");
    const bookingsCollection = client
      .db("doctorsPortal1")
      .collection("bookings");
    const userCollection = client.db("doctorsPortal1").collection("users");
    // Use Aggregate to query multiple collection and then merge data
    app.get("/appointmentOptions", async (req, res) => {
      const date = req.query.date;
      const query = {};
      const options = await appointmentOptionCollection.find(query).toArray();

      // get the bookings of the provided date
      const bookingQuery = { appointmentDate: date };
      const alreadyBooked = await bookingsCollection
        .find(bookingQuery)
        .toArray();

      // code carefully :D
      options.forEach((option) => {
        const optionBooked = alreadyBooked.filter(
          (book) => book.treatment === option.name
        );
        const bookedSlots = optionBooked.map((book) => book.slot);
        const remainingSlots = option.slots.filter(
          (slot) => !bookedSlots.includes(slot)
        );
        option.slots = remainingSlots;
      });
      res.send(options);
    });

    app.get("/v2/appointmentOptions", async (req, res) => {
      const date = req.query.date;
      const options = await appointmentOptionCollection
        .aggregate([
          {
            $lookup: {
              from: "bookings",
              localField: "name",
              foreignField: "treatment",
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $eq: ["$appointmentDate", date]
                    }
                  }
                }
              ],
              as: "booked"
            }
          },
          {
            $project: {
              name: 1,
              slots: 1,
              booked: {
                $map: {
                  input: "$booked",
                  as: "book",
                  in: "$$book.slot"
                }
              }
            }
          },
          {
            $project: {
              name: 1,
              slots: {
                $setDifference: ["$slots", "$booked"]
              }
            }
          }
        ])
        .toArray();
      res.send(options);
    });

    /***
     * API Naming Convention
     * app.get('/bookings')
     * app.get('/bookings/:id')
     * app.post('/bookings')
     * app.patch('/bookings/:id')
     * app.delete('/bookings/:id')
     */
    app.get("/bookings", async (req, res) => {
      const email = req.query.email;
      const query = { email: email };

      const bookings1 = await bookingsCollection.find(query).toArray();
      console.log(bookings1);
      res.send(bookings1);
    });

    app.post("/users", (req, res) => {
      console.log("122", req.body);
      const user1 = req.body;
      const data = userCollection.insertOne(user1);
      res.send(data);
    });
    app.post("/bookings", async (req, res) => {
      const booking = req.body;
      // console.log(booking);
      const query = {
        appointmentDate: booking.appointmentDate,
        email: booking.email,
        treatment: booking.treatment
      };

      app.get("/jwt", async (req, res) => {
        const email = req.query.email;

        const query = { email: email };
        const user = await userCollection.findOne(query);
        console.log(user);
        if (user) {
          res.send({ accessToken: "accestoken" });
          const token = jwt.sign({ email }, process.env.ACCESS_TOKEN, {
            expiresIn: "1 hr"
          });
          return token;
        } else {
          res.send(403).send("Error");
        }

        console.log(email);
      });

      const alreadyBooked = await bookingsCollection.find(query).toArray();

      if (alreadyBooked.length) {
        const message = `You already have a booking on ${booking.appointmentDate}`;
        return res.send({ acknowledged: false, message });
      }

      const result = await bookingsCollection.insertOne(booking);
      res.send(result);
    });
  } finally {
  }
}
run().catch(console.log);

app.get("/", async (req, res) => {
  res.send("doctors portal server is running");
});

app.listen(port, () => console.log(`Doctors portal running on ${port}`));
