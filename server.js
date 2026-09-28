const express = require("express");
const { MongoClient } = require("mongodb");
const path = require("path");

const app = express();

// AWS can provide its own port.
// Locally, the server will still use port 3000.
const port = process.env.PORT || 3000;

// Use MongoDB Atlas in the cloud when MONGODB_URI exists.
// Otherwise use local MongoDB.
const mongoUrl =
    process.env.MONGODB_URI ||
    "mongodb://127.0.0.1:27017";

const client = new MongoClient(mongoUrl);

let collection;

app.use(express.json());

// Serve the dashboard.
app.use(
    express.static(
        path.join(__dirname, "public")
    )
);



// HEALTH CHECK
// AWS can use this to check if the service is alive.

app.get("/health", (req, res) => {
    res.status(200).json({
        status: "healthy"
    });
});


// POST environmental data
// Node-RED sends readings here.

app.post("/environment", async (req, res) => {
    try {
        const data = req.body;

        const document = {
            building: data.building,
            floor: data.floor,
            room: data.room,
            temperature: data.temperature,
            humidity: data.humidity,
            timestamp: new Date()
        };

        const result =
            await collection.insertOne(document);

        console.log(
            `Saved reading for ${document.building}`
        );

        res.status(201).json({
            message: "Saved successfully",
            id: result.insertedId
        });

    } catch (error) {
        console.error(
            "Error saving data:",
            error
        );

        res.status(500).json({
            message: "Failed to save data"
        });
    }
});


// GET latest reading for each location

app.get("/environment/latest", async (req, res) => {
    try {
        const buildings = [
            "Melbourne",
            "Geelong",
            "Ballarat",
            "Bendigo"
        ];

        const latestData = [];

        for (const building of buildings) {

            const reading =
                await collection.findOne(
                    {
                        building: building
                    },
                    {
                        sort: {
                            timestamp: -1
                        }
                    }
                );

            if (reading) {
                latestData.push(reading);
            }
        }

        res.status(200).json(latestData);

    } catch (error) {
        console.error(
            "Error retrieving data:",
            error
        );

        res.status(500).json({
            message:
                "Failed to retrieve environmental data"
        });
    }
});


// GET latest 100 readings

app.get("/environment", async (req, res) => {
    try {
        const data =
            await collection
                .find()
                .sort({
                    timestamp: -1
                })
                .limit(100)
                .toArray();

        res.status(200).json(data);

    } catch (error) {
        console.error(
            "Error retrieving data:",
            error
        );

        res.status(500).json({
            message:
                "Failed to retrieve environmental data"
        });
    }
});


// Connect to MongoDB and start server

async function startServer() {
    try {
        await client.connect();

        const db =
            client.db("smartBuildingDB");

        collection =
            db.collection("environmentData");

        console.log("Connected to MongoDB");

        app.listen(port, "0.0.0.0", () => {
            console.log(
                `Node.js service running on port ${port}`
            );

            console.log(
                `Dashboard available at http://127.0.0.1:${port}`
            );
        });

    } catch (error) {
        console.error(
            "Startup error:",
            error
        );

        process.exit(1);
    }
}


startServer();