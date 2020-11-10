const express = require('express');
const cors = require('cors');
const usersRoute = express.Router();
const jwt = require('jsonwebtoken');
const { genSaltSync, hashSync, compareSync } = require('bcryptjs');
const crypto = require("crypto");
const AdminGpaidVendorModel = require('./adminGpaidVendors.model');
const AdminBranchModel = require('./adminBranches.model');
const salt = genSaltSync(10);

usersRoute.use(cors());

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

/////////////////////////////////////Allow new admins to sign up///////////////////////////////////////////
usersRoute.post('/admin-vendors/create_account', (req, res) => {
    const admin_id = crypto.randomBytes(14).toString('hex');

    const adminData = {
        id: admin_id,
        username: req.body.username,
        email: req.body.email,
        password: hashSync(req.body.password, salt),
        created_at: today + " " + currentTime,
        updated_at: today + " " + currentTime
    }

    AdminGpaidVendorModel.findOne({
        where: {
            email: req.body.email
        }
    })
    .then(user => {
        if (!user) {
            AdminGpaidVendorModel.create(adminData)
                .then(user => {
                    res.json({ status: user.username + ' registered' });
                })
                .catch(err => {
                    res.send('error: ' + err);
                })
        } else {
            res.json({ message: 'Email already exists' });
        }
    })
    .catch(err => {
        res.send('error: ' + err);
    })
});

usersRoute.post('/admin-branch/create_account', (req, res) => {
    const admin_id = crypto.randomBytes(15).toString('hex');

    const adminData = {
        id: admin_id,
        username: req.body.username,
        business_code: req.body.business_code,
        password: hashSync(req.body.password, salt),
        created_at: today + " " + currentTime,
        updated_at: today + " " + currentTime
    }

    AdminBranchModel.findOne({
            where: {
                business_code: req.body.business_code
            }
        })
        .then(user => {
            if (!user) {
                AdminBranchModel.create(adminData)
                    .then(user => {
                        res.json({ status: user.username + ' registered' });
                    })
                    .catch(err => {
                        res.send('error: ' + err);
                    })
            } else {
                res.json({ message: 'Business code already exists' });
            }
        })
        .catch(err => {
            res.send('error: ' + err);
        })
});

/////////////////////////////////////Allow admins to login/////////////////////////////////////////////////
usersRoute.post('/admin-vendors/login', (req, res) => {
    AdminGpaidVendorModel.findOne({
            where: {
                email: req.body.email
            }
        })
        .then(user => {
            if (user) {
                if (compareSync(req.body.password, user.password)) {
                    let token = jwt.sign(user.dataValues, process.env.SECURITY_KEY, {
                        expiresIn: "14days"
                    });
                    //res.send(token);
                    res.json({
                        is_user: true,
                        id: user.id,
                        username: user.username,
                        email: user.email,
                        message: 'Logged in successfully',
                        userToken: token
                    });
                } else {
                    res.json({
                        is_user: false,
                        message: 'Email or password is incorrect'
                    });
                }
            } else {
                res.json({
                    is_user: false,
                    message: 'User does not exist'
                });
            }
        })
        .catch(err => {
            res.json({ error: err });
        });
});

usersRoute.post('/admin-branch/login', (req, res) => {
    AdminBranchModel.findOne({
            where: {
                username: req.body.username
            }
        })
        .then(user => {
            if (user) {
                if (compareSync(req.body.password, user.password)) {
                    let token = jwt.sign(user.dataValues, process.env.SECURITY_KEY, {
                        expiresIn: "24h"
                    });
                    //res.send(token);
                    res.json({
                        is_user: true,
                        id: user.id,
                        username: user.username,
                        business_code: user.business_code,
                        message: 'Logged in successfully',
                        user_token: token
                    });
                } else {
                    res.json({
                        is_user: false,
                        message: 'Username or password is incorrect'
                    });
                }
            } else {
                res.json({
                    is_user: false,
                    message: 'User does not exist'
                });
            }
        })
        .catch(err => {
            res.json({ error: err });
        });
});

/////////////////////////////////////Allow admins to change passwords/////////////////////////////////////////////////
usersRoute.put('/admin-vendors/change_password/:id', (req, res) => {
    const old_password = req.body.old_password;
    const new_password = req.body.new_password;

    AdminGpaidVendorModel.findOne({
        where: {
            email: req.body.email
        }
    })
    .then(user => {
        if (user) {
            if (compareSync(old_password, user.password)) {

                AdminGpaidVendorModel.update({
                    password: hashSync(new_password, salt),
                    updated_at: today + " " + currentTime
                }, {
                    where: {
                        id: req.params.id
                    }
                })
                .then(user => res.json({
                    message: 'Password changed successfully'
                }));

            } else {
                res.json({
                    message: 'Current password is incorrect'
                });
            }
        }
    })
    .catch(err => {
        res.json({ error: err });
    });
});

usersRoute.put('/admin-branch/change_password/:id', (req, res) => {
    const old_password = req.body.old_password;
    const new_password = req.body.new_password;

    AdminBranchModel.findOne({
        where: {
            username: req.body.username
        }
    })
    .then(user => {
        if (user) {
            if (compareSync(old_password, user.password)) {

                AdminBranchModel.update({
                    password: hashSync(new_password, salt),
                    updated_at: today + " " + currentTime
                }, {
                    where: {
                        id: req.params.id
                    }
                })
                .then(user => {
                    res.json({
                        message: 'Password changed successfully'
                    });
                });

            }else {
                res.json({
                    message: 'Current password is incorrect'
                });
            }
        }
    })
    .catch(err => {
        res.json({ error: err });
    });
});

module.exports = usersRoute;
