
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