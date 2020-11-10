const Sequelize = require('sequelize');
const db = require('../../config/db_config');

module.exports = db.sequelize.define(
    'adminBranches', {
        id: {
            type: Sequelize.STRING,
            primaryKey: true,
            //autoIncrement: true
        },
        username: {
            type: Sequelize.STRING
        },
        business_code: {
            type: Sequelize.STRING
        },
        password: {
            type: Sequelize.STRING
        },
        created_at: {
            type: Sequelize.STRING
        },
        updated_at: {
            type: Sequelize.STRING
        }  

    }, {
        timestamps: false
    }
);