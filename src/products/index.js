const express = require('express');
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('products', router);

app.listen(6003, () => {
    console.log('server started');
})