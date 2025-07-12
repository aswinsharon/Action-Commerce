const express = require('express');
const cors = require('cors');

const server = express();
server.use(express.json());
server.use(cors());

server.listen(3000, () => {
    console.log("server started 🚀")
})