const Sequelize = require('sequelize');
const db = require('../../config/db_config');

module.exports = db.sequelize.define(
    'months', {
        id: {
            type: Sequelize.STRING,
            primaryKey: true,
            //autoIncrement: true
        },
        month: {
            type: Sequelize.STRING
        },
        created_at: {
            type: Sequelize.STRING
        },  

    }, {
        timestamps: false
    }
);