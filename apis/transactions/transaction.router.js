const express = require('express');
const cors = require('cors');
const axios = require('axios');
const transactionsRoute = express.Router();
const crypto = require("crypto");
const randomize = require('randomatic');

transactionsRoute.use(cors());

/////////////////////////////////////Allow users to get payments or deposit///////////////////////////////////////////
transactionsRoute.post('/deposit', (req, res) => {

    var msisdn = req.body.msisdn;
    var amount = req.body.amount;
    var merchantCode = "07513";
    var transactionId = randomize('0', 15);
    var consumerKey = "JDJ5cITHiCQqbOfQAbD9fF743M1601732533";
    var auth_signature = crypto.randomBytes(20).toString('hex');
    var narration = "testing";

    const depositData = {
        msisdn: msisdn,
        amount: amount,
        merchantCode: merchantCode,
        transactionId: transactionId,
        consumerKey: consumerKey,
        auth_signature: auth_signature,
        narration: narration
    }

    const body = JSON.stringify(depositData);

    axios.post("https://vendors.pay-leo.com/api/v2/test/deposit", {
        body
    })
    .then((response) => {
        console.log(body)
        console.log("++++++response++++++")
        console.log(response.data)
        res.json(response.data)
    })
    .catch((error) => {
        console.log(error)
    })

});

module.exports = transactionsRoute;