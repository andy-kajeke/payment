const Sequelize = require('sequelize');
const db = require('../../config/db_config');

module.exports = db.sequelize.define(
    'runningBalances', {
        id: {
            type: Sequelize.STRING,
            primaryKey: true,
            //autoIncrement: true
        },
        business_code: {
            type: Sequelize.STRING
        },
        old_balance: {
            type: Sequelize.STRING
        },
        new_balance: {
            type: Sequelize.STRING
        },
        transaction_ref: {
            type: Sequelize.STRING
        },
        description: {
            type: Sequelize.STRING
        }, 
        created_at: {
            type: Sequelize.STRING
        }, 

    }, {
        timestamps: false
    }
);