const Sequelize = require('sequelize');
const db = require('../../config/db_config');

module.exports = db.sequelize.define(
    'accountBalances', {
        id: {
            type: Sequelize.STRING,
            primaryKey: true,
            //autoIncrement: true
        },
        business_code: {
            type: Sequelize.STRING
        },
        actual_balance: {
            type: Sequelize.STRING
        },
        available_balance: {
            type: Sequelize.STRING
        },
        created_at: {
            type: Sequelize.STRING
        },  

    }, {
        timestamps: false
    }
);