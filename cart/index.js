const express = require('express');
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/carts', routes);

app.listen(6002, () => {
    console.log("carts server started");
});