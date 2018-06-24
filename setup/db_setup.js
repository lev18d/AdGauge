/**
 * @fileoverview function for setting up the database schema
 */

"use strict";

const mysql = require('mysql2/promise');
const config = require('../config/config');
const DatabaseManager = require('../database/database_manager');

/**
 * creates a database and its tables if they do not exist
 * @returns {Promise}
 */
module.exports = function () {
    return new Promise((resolve, reject) => {
        mysql.createConnection({
            host: config.db_config.host,
            user: config.db_config.username,
            password: config.db_config.password
        }).then((con) => {
            return con.query('CREATE DATABASE IF NOT EXISTS ' + config.db_config.database);
        }).then((result) => {
            console.log('database created successfully!');
            let dbm = new DatabaseManager();
            return dbm.sync().then(() => {
                return loadMockData(dbm);
            });
        }).then(() => {
            resolve('database setup successfully!');
        }).catch((error) => {
            reject(error);
        });
    });
};

function loadMockData(dbm) {
    let models = dbm.models_;
    return loadMockDataProductList(models['Products']).then(() => {
        let dbm = new DatabaseManager();
        return dbm.recordCustomer({age: 20, ethnicity: 'asian', gender: 'male', emotion: 'happy'}, true).then(discount => {
            return dbm.applyDiscount(discount.discountCode, 300, ['shoes1', 'shoes2']);
        }).then(() => {
            return dbm.recordCustomer({age: 50, ethnicity: 'white', gender: 'female', emotion: 'sad'}, true);
        }).then(discount => {
            return dbm.applyDiscount(discount.discountCode, 400, ['shoes1', 'shoes2', 'sweater1']);
        });
    })
}

function loadMockDataProductList(model) {
    return model.bulkCreate([{name: 'shoes1', price: 200, category: 'Footwear'},
        {name: 'shoes2', price: 100, category: 'Footwear'},
        {name: 'sweater1', price: 100, category: 'Clothes'},
        {name: 'coat1', price: 300, category: 'Clothes'},
        {name: 'jeans1', price: 50, category: 'Pants'},
        {name: 'baseball hat1', price: 10, category: 'Hats'}]);
}
