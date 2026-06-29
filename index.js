
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());


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

        app.patch("/bookings/accept/:id", async (req, res) => {
            try {
                const id = req.params.id;

                // Validation Check: Verify if the incoming string is a valid MongoDB ObjectId
                if (!ObjectId.isValid(id)) {
                    return res.status(400).send({ success: false, message: "Invalid Booking ID format" });
                }

                const filter = { _id: new ObjectId(id) };
                const updateDoc = {
                    $set: {
                        bookingStatus: "accepted",
                    },
                };

                const result = await bookingsCollection.updateOne(filter, updateDoc);

                if (result.modifiedCount > 0) {
                    res.send({ success: true, modifiedCount: result.modifiedCount, message: "Booking request accepted successfully." });
                } else {
                    res.status(400).send({ success: false, message: "No changes made or booking request not found." });
                }
            } catch (error) {
                console.error("Backend accept booking error:", error);
                res.status(500).send({ success: false, message: error.message });
            }
        });

        app.patch("/bookings/reject/:id", async (req, res) => {
            try {
                const id = req.params.id;

                // Validation Check: Verify if the incoming string is a valid MongoDB ObjectId
                if (!ObjectId.isValid(id)) {
                    return res.status(400).send({ success: false, message: "Invalid Booking ID format" });
                }

                // Fetch the target booking details to get ticket reference and quantity
                const booking = await bookingsCollection.findOne({ _id: new ObjectId(id) });
                if (!booking) {
                    return res.status(404).send({ success: false, message: "Booking record not found." });
                }

                // Prevent processing if already rejected to avoid accidental double-increment bugs
                if (booking.bookingStatus === "rejected") {
                    return res.status(400).send({ success: false, message: "This booking is already rejected." });
                }

                const filter = { _id: new ObjectId(id) };
                const updateDoc = {
                    $set: {
                        bookingStatus: "rejected",
                    },
                };

                // Update the status inside bookingsCollection
                const result = await bookingsCollection.updateOne(filter, updateDoc);

                if (result.modifiedCount > 0) {
                    // 🔄 Rollback Logic: Increment the available quantity back to the main ticket
                    await ticketsCollection.updateOne(
                        { _id: new ObjectId(booking.ticketId) },
                        { $inc: { quantity: Number(booking.quantity) } }
                    );

                    res.send({ success: true, modifiedCount: result.modifiedCount, message: "Booking request rejected and inventory restored." });
                } else {
                    res.status(400).send({ success: false, message: "No changes made." });
                }
            } catch (error) {
                console.error("Backend reject booking error:", error);
                res.status(500).send({ success: false, message: error.message });
            }
        });


        app.get("/vendor/revenue/:email", async (req, res) => {
            try {
                const email = req.params.email;

                // A. Fetch all tickets published by this specific vendor
                const tickets = await ticketsCollection.find({ vendorEmail: email }).toArray();

                // B. Compile analytics for each individual ticket to populate charts
                const revenueData = await Promise.all(tickets.map(async (ticket) => {
                    // Count total accepted/paid booking requests for this ticket
                    const bookings = await bookingsCollection.find({
                        ticketId: ticket._id,
                        bookingStatus: { $in: ["accepted", "paid"] } // Count valid transactions
                    }).toArray();

                    // Accumulate total pieces sold
                    const totalSold = bookings.reduce((sum, b) => sum + Number(b.quantity), 0);

                    // Calculate total revenue generated from this ticket
                    const totalRevenue = bookings.reduce((sum, b) => sum + Number(b.totalPrice), 0);

                    return {
                        title: ticket.title,
                        quantity: Number(ticket.quantity) + totalSold,
                        sold: totalSold,
                        price: Number(ticket.price),
                        revenue: totalRevenue
                    };
                }));

                res.send(revenueData);
            } catch (error) {
                console.error("Revenue analytical compilation failure:", error);
                res.status(500).send({ message: error.message });
            }
        });


        //admin related tickets api
        app.get("/tickets/:id", async (req, res) => {
            try {
                const id = req.params.id;

                // ⚠️ Validation Check: Verify if the incoming string is a valid MongoDB ObjectId
                if (!ObjectId.isValid(id)) {
                    return res.status(400).send({ success: false, message: "Invalid Ticket ID format" });
                }

                // Query the database using the converted ObjectId instance
                const query = { _id: new ObjectId(id) };
                const result = await ticketsCollection.findOne(query);

                if (!result) {
                    return res.status(404).send({ success: false, message: "Ticket not found in DB" });
                }

                res.status(200).send(result);
            } catch (error) {
                console.error("Backend single ticket fetch error:", error);
                res.status(500).send({ success: false, message: "Internal Server Error" });
            }
        });
        app.patch("/tickets/admin/status/:id", async (req, res) => {
            try {
                const { id } = req.params;
                const { status } = req.body;

                if (!["approved", "rejected"].includes(status)) {
                    return res.status(400).send({
                        success: false,
                        message: "Invalid status",
                    });
                }

                const result = await ticketsCollection.updateOne(
                    { _id: new ObjectId(id) },
                    {
                        $set: {
                            verificationStatus: status,
                        },
                    }
                );

                res.send({
                    success: true,
                    modifiedCount: result.modifiedCount,
                });
            } catch (err) {
                res.status(500).send({
                    success: false,
                    message: "Server error",
                });
            }
        });


        app.get("/approved-tickets", async (req, res) => {
            try {

                const query = { status: "approved" };

                const result = await client.db("ticketBariDB")
                    .collection("ticketsCollection")
                    .find(query)
                    .toArray();

                res.send(result);
            } catch (error) {
                console.error("Error fetching approved tickets:", error);
                res.status(500).send({ message: "Internal Server Error" });
            }
        });

        app.patch("/tickets/approve/:id", async (req, res) => {
            try {
                const { id } = req.params;

                if (!ObjectId.isValid(id)) {
                    return res.status(400).send({
                        success: false,
                        message: "Invalid Ticket ID",
                    });
                }

                // টিকিট আছে কিনা চেক
                const ticket = await ticketsCollection.findOne({
                    _id: new ObjectId(id),
                });

                if (!ticket) {
                    return res.status(404).send({
                        success: false,
                        message: "Ticket not found",
                    });
                }

                // Already approved হলে আর update করবে না
                if (ticket.verificationStatus === "approved") {
                    return res.status(400).send({
                        success: false,
                        message: "Ticket is already approved",
                    });
                }

                const result = await ticketsCollection.updateOne(
                    {
                        _id: new ObjectId(id),
                    },
                    {
                        $set: {
                            verificationStatus: "approved",
                        },
                    }
                );

                res.send({
                    success: true,
                    modifiedCount: result.modifiedCount,
                    message: "Ticket approved successfully.",
                });
            } catch (error) {
                console.error(error);

                res.status(500).send({
                    success: false,
                    message: error.message,
                });
            }
        });

        app.patch("/tickets/reject/:id", async (req, res) => {
            try {
                const { id } = req.params;

                if (!ObjectId.isValid(id)) {
                    return res.status(400).send({
                        success: false,
                        message: "Invalid Ticket ID",
                    });
                }

                // টিকিট আছে কিনা চেক
                const ticket = await ticketsCollection.findOne({
                    _id: new ObjectId(id),
                });

                if (!ticket) {
                    return res.status(404).send({
                        success: false,
                        message: "Ticket not found",
                    });
                }

                // Already rejected হলে আর update করবে না
                if (ticket.verificationStatus === "rejected") {
                    return res.status(400).send({
                        success: false,
                        message: "Ticket is already rejected",
                    });
                }

                const result = await ticketsCollection.updateOne(
                    {
                        _id: new ObjectId(id),
                    },
                    {
                        $set: {
                            verificationStatus: "rejected",
                        },
                    }
                );

                res.send({
                    success: true,
                    modifiedCount: result.modifiedCount,
                    message: "Ticket rejected successfully.",
                });
            } catch (error) {
                console.error(error);

                res.status(500).send({
                    success: false,
                    message: error.message,
                });
            }
        });

        app.patch("/tickets/advertise/:id", async (req, res) => {
            try {
                const id = req.params.id;
                const { isAdvertised } = req.body;

                const filter = { _id: new ObjectId(id) };
                const updateDoc = {
                    $set: {
                        isAdvertised: isAdvertised
                    }
                };

                const result = await ticketsCollection.updateOne(filter, updateDoc);

                if (result.modifiedCount > 0) {
                    res.send({ success: true, modifiedCount: result.modifiedCount });
                } else {
                    res.status(400).send({ success: false, message: "No changes made or ticket not found" });
                }
            } catch (error) {
                res.status(500).send({ message: error.message });
            }
        });



        // bookings
        app.post("/bookings", async (req, res) => {
            try {
                const bookingInfo = req.body;
                const { ticketId, quantity, userEmail } = bookingInfo;

                // Validation Guard: Ensure valid MongoDB ObjectId format
                if (!ticketId || !ObjectId.isValid(ticketId)) {
                    return res.status(400).send({ success: false, message: "Invalid or missing Ticket ID format." });
                }

                // Fetch the specific ticket to verify real-time inventory and departure status
                const ticket = await ticketsCollection.findOne({ _id: new ObjectId(ticketId) });

                if (!ticket) {
                    return res.status(404).send({ success: false, message: "The requested ticket does not exist." });
                }

                // Guard Rule 1: Check if the departure timeline has already crossed
                if (new Date(ticket.departure) <= new Date()) {
                    return res.status(400).send({ success: false, message: "Booking closed. Departure date has already passed." });
                }

                // Guard Rule 2: Prevent transactions on completely sold-out options
                if (ticket.quantity === 0) {
                    return res.status(400).send({ success: false, message: "Booking failed. This ticket is out of stock." });
                }

                // Guard Rule 3: Enforce volume constraint based on current inventory capacity
                if (Number(quantity) > ticket.quantity) {
                    return res.status(400).send({
                        success: false,
                        message: `Booking quantity exceeds stock limit. Max available: ${ticket.quantity} Pcs`
                    });
                }

                // Build verified transaction record document
                const finalBookingDoc = {
                    ticketId: new ObjectId(ticketId),
                    ticketTitle: bookingInfo.ticketTitle || ticket.title,
                    price: Number(ticket.price),
                    quantity: Number(quantity),
                    totalPrice: Number(ticket.price) * Number(quantity),
                    userEmail: userEmail,
                    userName: bookingInfo.userName || "Anonymous",
                    vendorEmail: ticket.vendorEmail,
                    image: ticket?.image,
                    from: ticket?.from,
                    to: ticket?.to,
                    departure: ticket?.departure,
                    bookingStatus: "pending", // Hardcoded entry status per design instructions
                    createdAt: new Date()
                };

                // Insert booking into bookingsCollection
                const bookingResult = await bookingsCollection.insertOne(finalBookingDoc);

                if (bookingResult.insertedId) {
                    // Atomic decrement operation on tickets availability stock metrics
                    await ticketsCollection.updateOne(
                        { _id: new ObjectId(ticketId) },
                        { $inc: { quantity: -Number(quantity) } }
                    );

                    return res.status(201).send({
                        success: true,
                        insertedId: bookingResult.insertedId,
                        message: "Booking successfully saved with a 'Pending' status."
                    });
                }

                res.status(500).send({ success: false, message: "Failed to persist transaction logs." });

            } catch (error) {
                console.error("Booking submission processing error:", error);
                res.status(500).send({ message: error.message });
            }
        });

        app.get("/my-bookings/:email", async (req, res) => {
            try {
                const email = req.params.email;
                const query = { userEmail: email };

                // Returns user-specific documents sorted in a chronological stack sequence
                const result = await bookingsCollection.find(query).sort({ createdAt: -1 }).toArray();
                res.send(result);
            } catch (error) {
                console.error("Fetch user personal bookings error:", error);
                res.status(500).send({ error: "Failed to fetch booking histories." });
            }
        });



        app.post("/payments/success", async (req, res) => {
            try {
                const { bookingId, transactionId, userEmail, amount, ticketTitle, ticketId, quantity } = req.body;

                // Create a record entry logs within payments records
                const paymentDoc = {
                    transactionId,
                    bookingId: new ObjectId(bookingId),
                    ticketId: new ObjectId(ticketId),
                    ticketTitle,
                    amount: Number(amount),
                    userEmail,
                    paymentDate: new Date()
                };

                // A. Insert entry logs inside payments data collection
                const paymentResult = await client.db("ticketBariDB").collection("paymentsCollection").insertOne(paymentDoc);

                // B. Shift booking status parameter flags to "paid"
                await bookingsCollection.updateOne(
                    { _id: new ObjectId(bookingId) },
                    { $set: { bookingStatus: "paid" } }
                );

                res.status(201).send({ success: true, insertedId: paymentResult.insertedId });

            } catch (error) {
                console.error("Payment confirmation execution framework error:", error);
                res.status(500).send({ message: error.message });
            }
        });


        app.get("/my-payments/:email", async (req, res) => {
            try {
                const email = req.params.email;
                const query = { userEmail: email };

                const result = await client.db("ticketBariDB").collection("paymentsCollection")
                    .find(query)
                    .sort({ paymentDate: -1 })
                    .toArray();

                res.send(result);
            } catch (error) {
                res.status(500).send({ error: "Failed to collect account transactions ledger logs." });
            }
        });



        

        // Endpoint to patch status on validation completion
        app.patch("/bookings/update-status/:id", async (req, res) => {
            const { id } = req.params;
            const { status, transactionId } = req.body;

            // Database update logic here (e.g., MongoDB, PostgreSQL)
            // Update booking state setting bookingStatus = status, transactionId = transactionId
            res.send({ success: true });
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