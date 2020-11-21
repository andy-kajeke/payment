const express = require('express');
const cors = require('cors');
const BranchRoute = express.Router();
const crypto = require("crypto");
const randomize = require('randomatic');
const BranchModel = require('./branches.model');
const AccountsModel = require('../accounts/accountBanlance.model');

BranchRoute.use(cors());

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

/////////////////////////////////////Adding new branches//////////////////////////////////////////
BranchRoute.post('/register', (req, res) => {
    const branch_id = crypto.randomBytes(15).toString('hex');
    const account_id = crypto.randomBytes(15).toString('hex');
    var business_code = randomize('0', 5);

    const branchData = {
        id: branch_id,
        business_code: business_code,
        business_name: req.body.business_name,
        business_category: req.body.business_category,
        office_contact: req.body.office_contact,
        email: req.body.email,
        director_surname: req.body.director_surname,
        director_middleName: req.body.director_middleName,
        director_otherName: req.body.director_otherName,
        director_gender: req.body.director_gender,
        director_nationality: req.body.director_nationality,
        director_countryOfResidence: req.body.director_countryOfResidence,
        director_contact: req.body.director_contact,
        director_email: req.body.director_email,
        bank_name: req.body.bank_name,
        bank_branch: req.body.bank_branch,
        bank_accountName: req.body.bank_accountName,
        bank_accountNumber: req.body.bank_accountNumber,
        callback_url: '',
        created_at: today,
        time_at: currentTime
    }

    const accountsData = {
        id: account_id,
        business_code: business_code,
        business_name: req.body.business_name,
        actual_balance: '0.00',
        available_balance: '0.00',
        created_at: today + ' ' + currentTime
    }

    BranchModel.create(branchData)
    .then(() => {
        res.json({ message: 'Registered..!!' });
        AccountsModel.create(accountsData);
    })
    .catch(err => {
        res.send('error: ' + err);
    })

});

/////////////////////////////////////Get all registered branches////////////////////////////////////////////////
BranchRoute.get('/', (req, res) => {
    BranchModel.findAll().then(branches => res.json({ branches }));
});

/////////////////////////////////////Get branch by business code/////////////////////////////////////////////////
BranchRoute.get('/:business_code', (req, res) => {
    BranchModel.findAll({
        where: {
            business_code: req.params.business_code
        }
    }).then(branches => res.json({ branches }));
});

/////////////////////////////////////Get branch by category type/////////////////////////////////////////////////
BranchRoute.get('/category/:business_category', (req, res) => {
    BranchModel.findAll({
        where: {
            business_category: req.params.business_category
        }
    }).then(branches => res.json({ branches }));
});

/////////////////////////////////////Update branch record by business code////////////////////////////////////////////
BranchRoute.put('/update-info/:business_code', (req, res) => {
    BranchModel.update({
        business_name: req.body.business_name,
        business_category: req.body.business_category,
        office_contact: req.body.office_contact,
        email: req.body.email,
        director_surname: req.body.director_surname,
        director_middleName: req.body.director_middleName,
        director_otherName: req.body.director_otherName,
        director_gender: req.body.director_gender,
        director_nationality: req.body.director_nationality,
        director_contryOfResidence: req.body.director_contryOfResidence,
        director_contact: req.body.director_contact,
        director_email: req.body.director_email,
        bank_name: req.body.bank_name,
        bank_branch: req.body.bank_branch,
        bank_accountName: req.body.bank_accountName,
        bank_accontNumber: req.body.bank_accontNumber,
        created_at: today,
        time_at: currentTime
    }, {
        where: {
            business_code: req.params.business_code
        }
    }).then(user => res.json({
        message: 'Updated successfully..'
    }))
});

module.exports = BranchRoute;