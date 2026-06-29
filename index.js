
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());


const { MongoClient, ServerApiVersion } = require('mongodb');
// const uri = "mongodb+srv://adminTicketGhor:7Ttjkfy5Ysu1CQPh@cluster0.wix94kc.mongodb.net/?appName=Cluster0";
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.wix94kc.mongodb.net/?appName=Cluster0`;

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

        const usersCollection = client.db("ticketBariDB").collection("usersCollection");
        const ticketsCollection = client.db("ticketBariDB").collection("ticketsCollection");
        const bookingsCollection = client.db("ticketBariDB").collection("bookingsCollection");

        // users releated api
        app.get("/users", async (req, res) => {
            try {
                const result = await usersCollection.find().toArray();
                res.send(result);
            } catch (error) {
                res.status(500).send({ error: "Failed to fetch Users Data" });
            }

        })
        app.get("/users/:email", async (req, res) => {
            try {
                const email = req.params.email;
                const filter = { email: email };
                const result = await usersCollection.findOne(filter);
                res.send(result);
            } catch (error) {
                res.status(500).send({ error: "Failed to fetch Users Data" });
            }
        })

        app.post("/users", async (req, res) => {
            try {
                const userInfo = req.body;
                const result = await usersCollection.insertOne(userInfo);
                res.send(result)
            } catch (error) {
                res.status(500).send({ error: "Failed to insert User data" })
            }
        })
        app.patch("/users/admin/:id", async (req, res) => {
            try {
                const id = req.params.id;
                const result = await usersCollection.updateOne(
                    { _id: new ObjectId(id) },
                    {
                        $set: {
                            role: "admin",
                        },
                    }
                );

                res.send(result);
            } catch (error) {
                res.status(500).send({ message: error.message });
            }
        });

        app.patch("/users/vendor/:id", async (req, res) => {
            try {
                const id = req.params.id;

                const result = await usersCollection.updateOne(
                    { _id: new ObjectId(id) },
                    {
                        $set: {
                            role: "vendor",
                        },
                    }
                );

                res.send(result);
            } catch (error) {
                res.status(500).send({ message: error.message });
            }
        });

        app.patch("/users/fraud/:id", async (req, res) => {
            try {
                const id = req.params.id;
                const user = await usersCollection.findOne({
                    _id: new ObjectId(id),
                });
                await usersCollection.updateOne(
                    { _id: new ObjectId(id) },
                    {
                        $set: {
                            isFraud: true,
                        },
                    }
                );
                await ticketsCollection.updateMany(
                    {
                        vendorEmail: user.email,
                    },
                    {
                        $set: {
                            status: "hidden",
                        },
                    }
                );
                res.send({
                    success: true,
                    message: "Vendor marked as fraud.",
                });
            } catch (error) {
                res.status(500).send({ message: error.message });
            }
        });


        // tickets reletaed api
        app.get("/tickets/admin", async (req, res) => {
            try {
                const result = await ticketsCollection.find().toArray();
                res.send(result);
            } catch (error) {
                res.status(500).send({ error: "Failed to fetch Users Data" });
            }
        })
        app.post("/tickets", async (req, res) => {
            try {
                const ticket = req.body;

                ticket.verificationStatus = "pending";
                ticket.status = "published";
                ticket.createdAt = new Date();

                const result = await ticketsCollection.insertOne(ticket);

                res.send(result);
            } catch (error) {
                res.status(500).send({ message: error.message });
            }
        });
        app.get("/tickets/vendor/:email", async (req, res) => { //vendors ticket
            try {
                const email = req.params.email;

                const result = await ticketsCollection
                    .find({ vendorEmail: email })
                    .toArray();

                res.send(result);
            } catch (error) {
                res.status(500).send({ message: error.message });
            }
        });
        app.patch("/tickets/:id", async (req, res) => { //update ticket
            try {
                const id = req.params.id;
                const data = req.body;

                const result = await ticketsCollection.updateOne(
                    { _id: new ObjectId(id) },
                    {
                        $set: data,
                    }
                );

                res.send(result);
            } catch (error) {
                res.status(500).send({ message: error.message });
            }
        });

        app.delete("/tickets/:id", async (req, res) => { //deletes ticket
            try {
                const id = req.params.id;

                const result = await ticketsCollection.deleteOne({
                    _id: new ObjectId(id),
                });

                res.send(result);
            } catch (error) {
                res.status(500).send({ message: error.message });
            }
        });

        app.get("/bookings/vendor/:email", async (req, res) => { //Requested Bookings
            try {
                const email = req.params.email;

                const result = await bookingsCollection
                    .find({ vendorEmail: email })
                    .toArray();

                res.send(result);
            } catch (error) {
                res.status(500).send({ message: error.message });
            }
        });

        app.patch("/bookings/accept/:id", async (req, res) => { //Accept Booking
            try {
                const id = req.params.id;

                const result = await bookingsCollection.updateOne(
                    { _id: new ObjectId(id) },
                    {
                        $set: {
                            bookingStatus: "accepted",
                        },
                    }
                );

                res.send(result);
            } catch (error) {
                res.status(500).send({ message: error.message });
            }
        });

        app.patch("/bookings/reject/:id", async (req, res) => { // Reject Booking
            try {
                const id = req.params.id;

                const result = await bookingsCollection.updateOne(
                    { _id: new ObjectId(id) },
                    {
                        $set: {
                            bookingStatus: "rejected",
                        },
                    }
                );

                res.send(result);
            } catch (error) {
                res.status(500).send({ message: error.message });
            }
        });

        app.get("/vendor/revenue/:email", async (req, res) => {  //Revenue Overview
            try {
                const email = req.params.email;

                const totalTickets = await ticketsCollection.countDocuments({
                    vendorEmail: email,
                });

                const soldTickets = await bookingsCollection.countDocuments({
                    vendorEmail: email,
                    bookingStatus: "accepted",
                });

                const bookings = await bookingsCollection
                    .find({
                        vendorEmail: email,
                        bookingStatus: "accepted",
                    })
                    .toArray();

                const revenue = bookings.reduce(
                    (sum, item) => sum + item.totalPrice,
                    0
                );

                res.send({
                    totalTickets,
                    soldTickets,
                    revenue,
                });
            } catch (error) {
                res.status(500).send({ message: error.message });
            }
        });








        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB! - (Kawsar)");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);



app.get('/', (req, res) => {
    res.send('Hello World!');
});

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});