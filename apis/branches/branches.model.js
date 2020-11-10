const Sequelize = require('sequelize');
const db = require('../../config/db_config');

module.exports = db.sequelize.define(
    'branches', {
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
        business_category: {
            type: Sequelize.STRING
        },
        office_contact: {
            type: Sequelize.STRING
        },
        email: {
            type: Sequelize.STRING
        },
        director_surname: {
            type: Sequelize.STRING
        },
        director_middleName: {
            type: Sequelize.STRING
        },
        director_otherName: {
            type: Sequelize.STRING
        },
        director_gender: {
            type: Sequelize.STRING
        },
        director_nationality: {
            type: Sequelize.STRING
        },
        director_countryOfResidence: {
            type: Sequelize.STRING
        },
        director_contact: {
            type: Sequelize.STRING
        },
        director_email: {
            type: Sequelize.STRING
        },
        bank_name: {
            type: Sequelize.STRING
        },
        bank_branch: {
            type: Sequelize.STRING
        },
        bank_accountName: {
            type: Sequelize.STRING
        },
        bank_accountNumber: {
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