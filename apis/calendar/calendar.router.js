const express = require('express');
const cors = require('cors');
const CalenderRoute = express.Router();
const crypto = require("crypto");
const YearModel = require('./year.model');
const MonthModel = require('./months.model');

CalenderRoute.use(cors());

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

/////////////////////////////////////Allow admins to add calender year///////////////////////////////////////////
CalenderRoute.post('/years/add', (req, res) => {
    const year_id = crypto.randomBytes(14).toString('hex');

    const yearData = {
        id: year_id,
        year: req.body.year,
        created_at: today + " " + currentTime
    }

    YearModel.create(yearData)
    .then(() => {
        res.json({ status: 'Registered' });
    })
    .catch(err => {
        res.send('error: ' + err);
    })
});

/////////////////////////////////////Allow admins to add calender month///////////////////////////////////////////
CalenderRoute.post('/months/add', (req, res) => {
    const year_id = crypto.randomBytes(14).toString('hex');

    const monthData = {
        id: year_id,
        month: req.body.month,
        created_at: today + " " + currentTime
    }

    MonthModel.create(monthData)
    .then(() => {
        res.json({ status: 'Registered' });
    })
    .catch(err => {
        res.send('error: ' + err);
    })
});

/////////////////////////////////////Get financial years//////////////////////////////////////////////////////////////
CalenderRoute.get('/years', (req, res) => {
    YearModel.findAll({
        order : [
            ['created_at', 'ASC']
        ]
    }).then(years => res.json({ years }));
});

/////////////////////////////////////Get financial months in a year/////////////////////////////////////////////////////////
CalenderRoute.get('/months', (req, res) => {
    MonthModel.findAll({
        order : [
            ['created_at', 'ASC']
        ]
    }).then(months => res.json({ months }));
});

module.exports = CalenderRoute;
