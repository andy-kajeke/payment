const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const transactionsRoute = express.Router();
const crypto = require("crypto");
const randomize = require('randomatic');
const LiveTransactionModel = require('./liveTransactions.model')
const RunningBalanceModel = require('../accounts/runningBanlance.model');
const AccountsModel = require('../accounts/accountBanlance.model');
const liveTransactionsModel = require('./liveTransactions.model');
const BranchModel = require('../branches/branches.model');
//const { where } = require('sequelize/types');

transactionsRoute.use(cors());

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
    var url = 'https://vendors.pay-leo.com/api/v2/live/deposit';
    var msisdn = req.body.msisdn;
    var amount = req.body.amount;
    var merchantCode = process.env.MerchantCode;
    var transactionId = randomize('0', 15);
    var consumerKey = process.env.ConsumerKey;
    var consumerSecret = process.env.ConsumerSecret;
    var narration = process.env.Narration;
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

    if(msisdn == ''){
        res.json({
            status: 'FAILED',
            code: 204,
            message: 'Missing required parameters'
        });
    }
    else if(amount == '')
    {
        res.json({
            status: 'FAILED',
            code: 204,
            message: 'Missing required parameters'
        });
    }
    else if(business_code == '')
    {
        res.json({
            status: 'FAILED',
            code: 204,
            message: 'Missing required parameters'
        });
    }
    else if(msisdn.length < 12)
    {
        res.json({
            status: 'FAILED',
            code: 204,
            message: 'Ivaild msisdn. msisdn is either incomplete or doesnot begin with 256'
        });
    }
    else if(msisdn.length > 12)
    {
        res.json({
            status: 'FAILED',
            code: 204,
            message: 'Ivaild msisdn. msisdn exceeds 12 digits'
        });
    }
    else if(Number(msisdn) == '' && amount == '' && business_code == '')
    {
        res.json({
            status: 'FAILED',
            code: 204,
            message: 'Missing required parameters'})
    }
    else{
        fetch('https://vendors.pay-leo.com/api/v2/live/deposit/', {
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
            BranchModel.findOne({
                where: {
                    business_code: business_code
                }
            }).then(branch => {
                if(branch){
                    const transaction_id = crypto.randomBytes(15).toString('hex');
                    LiveTransactionModel.create({
                        id: transaction_id,
                        msisdn: msisdn,
                        transaction_ref: transactionId,
                        payLeoReferenceId: '',
                        amount: amount + '.00',
                        business_code: business_code,
                        transaction_type: 'Credit',
                        transaction_status: 'PENDING',
                        payment_reason: 'Service payment',
                        month: monthNames[date.getMonth()], 
                        year: date.getFullYear(),
                        callback_url: branch.callback_url,
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

                    res.json({
                        status: 'OK',
                        code: 200,
                        message: 'Transaction is being processed',
                        transactionId: transactionId
                    })
                }
                else{
                    res.json({
                        status: 'FAILED',
                        code: 204,
                        message: 'business_code doesnot exist!!..'
                    });
                }
            });
            
        }
        else if(response.message == "Ip is not authorized"){
            res.json({
                status: 'FAILED',
                code: 204,
                message : response.message
            });
        }
        else{
            res.json({
                status : response.status,
                code : response.code,
                message : 'Something went wrong try again or contact service provider for help'
            })
        }
        
    });
    }
    
});

///////////////////////////////update from pay-leo/////////////////////////////////////////////////////
transactionsRoute.post('/deposit/update', (req, res, body) => {

    // Any request with an XML payload will be parsed
    // and a JavaScript object produced on req.body
    // corresponding to the request payload.
    console.log(req.body);
    var response = req.body.request;
    res.send(JSON.parse(req.body));

    if(response['method'] == 'receivePayment'){
        liveTransactionsModel.findOne({
            where: {
                transaction_ref: response['client_transaction'],
                msisdn: response['msisdn']
            }
        }).then(trans => {
            if(trans){
                liveTransactionsModel.update({
                    transaction_status: 'SUCCESS',
                    payLeoReferenceId: response['referenceid']
                },{
                    where: {
                        transaction_ref: response['client_transaction']
                    }
                }).then(() => {
                    const callbackResponseData = {
                        method: response['method'],
                        msisdn: response['msisdn'],
                        amount: response['amount'],
                        transactionId: response['client_transaction'],
                        message: response['message']
                    }
    
                    fetch(trans.callback_url, {
                        method: 'POST',
                        body: JSON.stringify(callbackResponseData), 
                        headers: { 'Content-Type': 'application/json' }
                    })
                    .then(res => res.json())
                    .then(response => {});
                });
            }
            else{
                res.json({
                    status: 'FAILED',
                    code: 204,
                    message: 'transactionId: ' + response['client_transaction'] + ' doesnot exit!!..'
                });
            }
        });
    }
    else if(response['method'] == 'notifyFailedPayment'){
        liveTransactionsModel.findOne({
            where: {
                transaction_ref: response['client_transaction'],
                msisdn: response['msisdn']
            }
        }).then(tranz => {
            if(tranz){
                liveTransactionsModel.update({
                    transaction_status: 'FAILED',
                    payLeoReferenceId: response['referenceid']
                },{
                    where: {
                        transaction_ref: response['client_transaction']
                    }
                }).then(() => {
                    const callbackResponseData = {
                        method: response['method'],
                        msisdn: response['msisdn'],
                        amount: response['amount'],
                        transactionId: response['client_transaction'],
                        message: response['message']
                    }
    
                    fetch(tranz.callback_url, {
                        method: 'POST',
                        body: JSON.stringify(callbackResponseData), 
                        headers: { 'Content-Type': 'application/json' }
                    })
                    .then(res => res.json())
                    .then(response => {});
                });
            }
            else{
                res.json({
                    status: 'FAILED',
                    code: 204,
                    message: 'transactionId: ' + response['client_transaction'] + ' doesnot exit!!..'
                });
            }
        });
    }
    else{
        res.json({message: 'Something went wrong'});
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

/////////////////////////////////////Get all transactions by business code//////////////////////////////////////////////////////////////
transactionsRoute.get('/:busness_code', (req, res) => {
    LiveTransactionModel.findOne({
        where: {
            business_code: req.params.business_code,
        }

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

/////////////////////////////////////Get all transactions value//////////////////////////////////////////////////////////////
transactionsRoute.get('/gpaid/Vendors/all/depositValue', (req, res) => {
    LiveTransactionModel.sum(
        'amount', 
        {
            where: { 
                transaction_status: 'SUCCESS', 
                month: monthNames[date.getMonth()], 
                year: date.getFullYear()
            }
        }
    ).then(money => {res.json({money})})
});

/////////////////////////////////////Get all transactions value by business code/////////////////////////////////////////////
transactionsRoute.get('/gpaidVendors/all/depositValue/:business_code', (req, res) => {    
    LiveTransactionModel.sum(
        'amount', 
        {
            where: { 
                business_code: req.params.business_code,
                transaction_status: 'SUCCESS', 
                month: monthNames[date.getMonth()], 
                year: date.getFullYear()
            }
        }
    ).then(money => {
        res.json({money})
        console.log(money)

        if(money == null){
            AccountsModel.update({
                actual_balance: '0.00',
                commission: '0.00',
                available_balance: '0.00'
            },{
                where: {business_code: req.params.business_code}
            });
        }else{
            var actual = money;
            var comm = (money) * (5 / 100);
            var available = actual - comm;

            AccountsModel.update({
                actual_balance: actual,
                commission: comm,
                available_balance: available,
                created_at: today + ' ' + currentTime
            },{
                where: {business_code: req.params.business_code}
            });
        }
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