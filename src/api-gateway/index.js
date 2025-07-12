const express = require('express');
const http = require('http-proxy');
const cors = require('cors');

const server = express();
const proxy = http.createProxyServer();

server.use(express.json());
server.use(cors());

app.use("/products", (req, res) => {
    proxy.web(req, res, {
        target: "http://localhost:6001"
    });
});

app.use("/carts", (req, res) => {
    proxy.web(req, res, {
        target: "http://localhost:6002"
    });
});

app.use("/orders", (req, res) => {
    proxy.web(req, res, {
        target: "http://localhost:6003"
    });
});

app.use("/payments", (req, res) => {
    proxy.web(req, res, {
        target: "http://localhost:6004"
    });
});

server.listen(3000, () => {
    console.log("server started 🚀")
})