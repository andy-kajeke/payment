require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
require('body-parser-xml')(bodyParser);
const app = express();

app.use(bodyParser.xml({
    limit: '1MB',   // Reject payload bigger than 1 MB
    xmlParseOptions: {
      normalize: true,     // Trim whitespace inside text nodes
      normalizeTags: true, // Transform tags to lowercase
      explicitArray: false // Only put nodes in array if >1
    }
}));
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