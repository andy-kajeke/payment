const express = require('express');
const cors = require('cors');
const payLeoResponse = require('xml2js').parseString;
const fetch = require('node-fetch');
const transactionsRoute = express.Router();
const crypto = require("crypto");
const randomize = require('randomatic');
const LiveTransactionModel = require('./liveTransactions.model')
const RunningBalanceModel = require('../accounts/runningBanlance.model');
//const { where } = require('sequelize/types');

transactionsRoute.use(cors());

////////////////////////////////////Date and time//////////////////////////////////////////////////////////////
var date = new Date();
let today = date.getFullYear() + "-" + ("0" + (date.getMonth() + 1)).slice(-2) + "-" + ("0" + date.getDate()).slice(-2);

var hours = date.getHours();
var minutes = date.getMinutes();
var seconds = date.getSeconds();
var ampm = hours >= 12 ? 'pm' : 'am';
hours = hours % 12;
hours = hours ? hours : 12; // the hour '0' should be '12'
minutes = minutes < 10 ? '0' + minutes : minutes;

var currentTime = hours + ':' + minutes + ':' + seconds + ' ' + ampm;

/////////////////////////////////////Allow users to get payments or deposit///////////////////////////////////////////
transactionsRoute.post('/deposit', (req, res) => {
    var url = 'https://vendors.pay-leo.com/api/v2/test/deposit';
    var msisdn = req.body.msisdn;
    var amount = req.body.amount;
    var merchantCode = "07513";
    var transactionId = randomize('0', 15);
    var consumerKey = "JDJ5cITHiCQqbOfQAbD9fF743M1601732533";
    var consumerSecret = "Af5plbxBSETqm1gZUDPJYz8W3d1601732533";
    var narration = "testing";
    var data = url + "&" + msisdn + "&" + amount + "&" + merchantCode + "&" + transactionId + "&" + narration;
    var auth_signature =  crypto.createHmac('sha256', consumerSecret).update(data).digest('hex');

    var business_code = req.body.business_code;

    let depositData = {
        msisdn: msisdn,
        amount: amount,
        merchantCode: merchantCode,
        transactionId: transactionId,
        consumerKey: consumerKey,
        auth_signature: auth_signature,
        narration: narration
    } 

    fetch('https://vendors.pay-leo.com/api/v2/test/deposit/', {
        method: 'POST',
        body: JSON.stringify(depositData),
        headers: { 'Content-Type': 'application/json' }
    })
    .then(res => res.json())
    .then(response => {
        console.log(response.message)

        if(response.message == 'Ip is not authorized'){
            const transaction_id = crypto.randomBytes(14).toString('hex');
            LiveTransactionModel.create({
                id: transaction_id,
                msisdn: msisdn,
                transaction_ref: transactionId,
                amount: amount,
                business_code: business_code,
                transaction_type: 'Customer Push',
                transaction_status: 'Pending',
                payment_reason: 'Service payment',
                created_at: today,
                time_at: currentTime
            })
            .then(trans => {
                const runningBalance_id = crypto.randomBytes(14).toString('hex');
                RunningBalanceModel.create({
                    id: runningBalance_id,
                    business_code: business_code,
                    old_balance: '0',
                    new_balance: amount,
                    transaction_ref: transactionId,
                    description: 'Your account has been credited with UGX ' + amount + ' by' + msisdn,
                    created_at: today + " " + currentTime
                })
                .then(rb => {
                    RunningBalanceModel.findOne({
                        where: {
                            transaction_ref: transactionId,
                            business_code: business_code
                        }
                    })
                    .then(balance => {
                        if(balance){
                            RunningBalanceModel.update({
                                new_balance: (balance.old_balance - 0) + (amount -0),
                                old_balance: balance.new_balance
                            }, {
                                  where: {
                                    transaction_ref: transactionId,
                                    business_code: business_code
                                  }
                                }
                            );
                        }
                    });
                })
            })
        }
        res.json({
            status : response.status,
            code : response.code,
            message : response.message,
            transactionId : response.transactionId
        })
    });
});

///////////////////////////////update from pay-leo/////////////////////////////////////////////////////
transactionsRoute.post('/deposit/update', (req, res) => {

    var data = '';
    req.setEncoding('utf8');
    xml = req.rawBody = data;

    //var xml = '<?xml version="1.0" encoding="UTF-8"?> <request><method>receivePayment</method><msisdn>256780289560</msisdn><transactionId>1399329291991912​</transactionId><referenceId>32432432423423222</referenceId><amount>500</amount><client_transaction>39293292142323​</client_transaction></request>';
    payLeoResponse(xml, function(error, result){
        if(error){
            console.log("Error: " + error)
            return;
        }
        console.dir(JSON.stringify(result))
        res.json(result);
    });
});

/////////////////////////////////////Get all transactions//////////////////////////////////////////////////////////////
transactionsRoute.get('/', (req, res) => {
    LiveTransactionModel.findAll({
        order : [
            ['created_at', 'DESC'],
            ['time_at', 'DESC']
        ]
    }).then(transfers => res.json({ transfers }));
});

/////////////////////////////////////Get all transactions by business code//////////////////////////////////////////////////////////////
transactionsRoute.get('/:busness_code', (req, res) => {
    LiveTransactionModel.findOne({
        where: {
            business_code: req.params.business_code,

            order : [
                ['created_at', 'DESC'],
                ['time_at', 'DESC']
            ]
        }

    }).then(transfers => res.json({ transfers }));
});

module.exports = transactionsRoute;