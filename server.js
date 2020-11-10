require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.listen(process.env.APP_PORT, () => {
    console.log('server is running at http://localhost:' + process.env.APP_PORT);
});

const usersRouter = require('./apis/users/users.router');
const branchRouter = require('./apis/branches/branches.router');
const transactionRouter = require('./apis/transactions/transaction.router');

app.use('/webapi/user', usersRouter);
app.use('/webapi/branches', branchRouter);
app.use('/webapi/transaction', transactionRouter);