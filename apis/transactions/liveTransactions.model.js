const Sequelize = require('sequelize');
const db = require('../../config/db_config');

module.exports = db.sequelize.define(
    'liveTransactions', {
        id: {
            type: Sequelize.STRING,
            primaryKey: true,
            //autoIncrement: true
        },
        msisdn: {
            type: Sequelize.STRING
        },
        transaction_ref: {
            type: Sequelize.STRING
        },
        payLeoReferenceId: {
            type: Sequelize.STRING
        },
        amount: {
            type: Sequelize.STRING
        },
        business_code: {
            type: Sequelize.STRING
        },
        transaction_type: {
            type: Sequelize.STRING
        },
        transaction_status: {
            type: Sequelize.STRING
        },
        payment_reason: {
            type: Sequelize.STRING
        },
        created_at: {
            type: Sequelize.STRING
        },
        time_at: {
            type: Sequelize.STRING
        }
        

    }, {
        timestamps: false
    }
);