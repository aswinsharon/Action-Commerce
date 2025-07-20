const express = require('express');
const route = require('./routes/categoryRoute');
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('categories', route);

app.listen(6003, () => {
    console.log('server started');
})