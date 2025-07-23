const express = require('express');
const route = require('./routes/categoryRoute');
const databaseConfig = require('../src/config/databaseConfig')
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/categories', route);

databaseConfig.on("connected", (_dbConnection) => {
    console.log("Event received: MongoDB connected successfully!");
});

const startServer = async () => {
    await databaseConfig.connect();
    app.listen(6003, () => {
        console.log(`Server is running on port ${6003}`);
    });
};

process.on("SIGINT", async () => {
    console.log("\nClosing MongoDB connection...");
    const dbConnection = databaseConfig.getDbConnection();
    if (dbConnection) {
        await dbConnection.close();
    }
    process.exit();
});

(async () => {
    await startServer();
})();