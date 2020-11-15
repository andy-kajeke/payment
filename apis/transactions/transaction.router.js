const express = require('express');
const cors = require('cors');
const mysql = require('mysql');
const fetch = require('node-fetch');
const transactionsRoute = express.Router();
const crypto = require("crypto");
const randomize = require('randomatic');
const LiveTransactionModel = require('./liveTransactions.model')
const RunningBalanceModel = require('../accounts/runningBanlance.model');
const AccountsModel = require('../accounts/accountBanlance.model');
const liveTransactionsModel = require('./liveTransactions.model');
//const { where } = require('sequelize/types');

transactionsRoute.use(cors());

var con = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

con.connect(function(err) {
  if (err) throw err;
});

////////////////////////////////////Date and time//////////////////////////////////////////////////////////////
var date = new Date();
var monthNames = ["January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

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
        //response.message == "Transaction is being processed"
        //response.message == "Ip is not authorized"

        if(response.message == "Transaction is being processed"){
            const transaction_id = crypto.randomBytes(15).toString('hex');
            LiveTransactionModel.create({
                id: transaction_id,
                msisdn: msisdn,
                transaction_ref: transactionId,
                payLeoReferenceId: '',
                amount: amount + '.00',
                business_code: business_code,
                transaction_type: 'Credit',
                transaction_status: 'Pending',
                payment_reason: 'Service payment',
                month: monthNames[date.getMonth()], 
                year: date.getFullYear(),
                created_at: today,
                time_at: currentTime
            })
            .then(() => {
                const runningBalance_id = crypto.randomBytes(15).toString('hex');
                RunningBalanceModel.create({
                    id: runningBalance_id,
                    business_code: business_code,
                    old_balance: amount,
                    new_balance: amount,
                    transaction_ref: transactionId,
                    payee_msisdn: msisdn,
                    description: 'Your account has been credited with UGX ' + amount + ' by ' + msisdn,
                    created_at: today + " " + currentTime
                });
            });
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
transactionsRoute.post('/deposit/update', (req, res, body) => {

    // Any request with an XML payload will be parsed
    // and a JavaScript object produced on req.body
    // corresponding to the request payload.
    console.log(req.body);
    var response = req.body.request;
    
    if(response['method'] == 'receivePayment'){
        liveTransactionsModel.findOne({
            where: {
                transaction_ref: response['client_transaction'],
                msisdn: response['msisdn']
            }
        }).then(() => {
            liveTransactionsModel.update({
                transaction_status: 'Success',
                payLeoReferenceId: response['referenceid']
            },{
                where: {
                    transaction_ref: response['client_transaction']
                }
            }).then(() => {
                
                res.status(200).end();
            });
        })
    }
    else{
        liveTransactionsModel.findOne({
            where: {
                transaction_ref: response['client_transaction'],
                msisdn: response['msisdn']
            }
        }).then(() => {
            liveTransactionsModel.update({
                transaction_status: 'Failed',
                payLeoReferenceId: response['referenceid']
            },{
                where: {
                    transaction_ref: response['client_transaction']
                }
            })
        });
        
    }
    
    res.status(200).end(); 
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

/////////////////////////////////////Get all transactions by month and year////////////////////////////////////////////////////
transactionsRoute.get('/:month/:year', (req, res) => {
    LiveTransactionModel.findAll({
        where: {
            month: req.params.month,
            year: req.params.year
        },
        order : [
            ['created_at', 'DESC'],
            ['time_at', 'DESC']
        ]
    }).then(transfers => res.json({ transfers }));
});

/////////////////////////////////////Get all branch transactions by business code, month and year/////////////////////////////////////
transactionsRoute.get('/:business_code/:month/:year', (req, res) => {
    LiveTransactionModel.findAll({
        where: {
            business_code: req.params.business_code,
            month: req.params.month,
            year: req.params.year
        },
        order : [
            ['created_at', 'DESC'],
            ['time_at', 'DESC']
        ]
    }).then(transfers => res.json({ transfers }));
});

/////////////////////////////////////Get all transactions by month and year////////////////////////////////////////////////////
transactionsRoute.get('/annual/report/:year', (req, res) => {
    LiveTransactionModel.findAll({
        where: {
            year: req.params.year
        },
        order : [
            ['created_at', 'DESC'],
            ['time_at', 'DESC']
        ]
    }).then(transfers => res.json({ transfers }));
});

/////////////////////////////////////Get all branch transactions by business code and year///////////////////////////////////////
transactionsRoute.get('/annual/report/:business_code/:year', (req, res) => {
    LiveTransactionModel.findAll({
        where: {
            business_code: req.params.business_code,
            year: req.params.year
        },
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
        }

    }).then(transfers => res.json({ transfers }));
});

/////////////////////////////////////Get all transactions value//////////////////////////////////////////////////////////////
transactionsRoute.get('/gpaid/Vendors/all/depositValue', (req, res) => {
    con.connect(function(err) {
        con.query(`SELECT SUM(amount) FROM liveTransactions WHERE transaction_status = 'Sucess' AND month = '${monthNames[date.getMonth()]}' AND year = '${date.getFullYear()}'`,
         function (err, actaulBalance, fields) {
          if (err) throw err;

          if(actaulBalance[0]['SUM(amount)'] == null){
            res.json({money: '0.00'});
          }
          else{
            res.json({money: actaulBalance[0]['SUM(amount)']});
          }
          
        });
      });
});

/////////////////////////////////////Get all transactions value by business code/////////////////////////////////////////////
transactionsRoute.get('/gpaidVendors/all/depositValue/:business_code', (req, res) => {
    con.connect(function(err) {
        con.query(`SELECT SUM(amount) FROM liveTransactions WHERE transaction_status = 'Sucess' AND month = '${monthNames[date.getMonth()]}' AND year = '${date.getFullYear()}' AND business_code = ${req.params.business_code}`, 
        function (err, actaulBalance, fields) {
          if (err) throw err;

          if(actaulBalance[0]['SUM(amount)'] == null){
            con.query(`UPDATE accountBalances SET actual_balance = '0.00', available_balance = '0.00' WHERE business_code = ${req.params.business_code}`, 
            function (err, fields){});

            res.json({money: '0.00'});
          }
          else{
            let commission = (actaulBalance[0]['SUM(amount)']) * (5 / 100);
            let available_balance = (actaulBalance[0]['SUM(amount)']) - commission;

            con.query(`UPDATE accountBalances SET actual_balance = ${(actaulBalance[0]['SUM(amount)']).toString()}, 
            available_balance = ${available_balance.toString()}, commission = ${commission.toString()}
             WHERE business_code = ${req.params.business_code}`, 
            function (err, fields){});

            res.json({money: actaulBalance[0]['SUM(amount)']});
          }
        });
      });
});

/////////////////////////////////////Get all transactions//////////////////////////////////////////////////////////////
transactionsRoute.get('/gpaidVendors/depositValue/accounts/balance', (req, res) => {
    AccountsModel.findAll({
        order : [
            ['created_at', 'DESC']
        ]
    }).then(accounts => res.json({ accounts }));
});

module.exports = transactionsRoute;