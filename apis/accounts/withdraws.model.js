const Sequelize = require('sequelize');
const db = require('../../config/db_config');

module.exports = db.sequelize.define(
    'withdraws', {
        id: {
            type: Sequelize.STRING,
            primaryKey: true,
            //autoIncrement: true
        },
        business_code: {
            type: Sequelize.STRING
        },
        business_name: {
            type: Sequelize.STRING
        },
        amount: {
            type: Sequelize.STRING
        },
        commission: {
            type: Sequelize.STRING
        },
        destination: {
            type: Sequelize.STRING
        },
        month: {
            type: Sequelize.STRING
        },
        year: {
            type: Sequelize.STRING
        },
        created_at: {
            type: Sequelize.STRING
        },  

    }, {
        timestamps: false
    }
);