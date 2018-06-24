/**
 * @fileoverview The interface object for working with the database
 * @author astral.cai@queensu.ca (Astral Cai)
 */

"use strict";

const config = require('../config/config');
const Sequelize = require('sequelize');
const Op = Sequelize.Op;
const tables = require('../config/tables');
const _ = require('underscore');
const lit = require('../config/literals');
const randomstring = require('randomstring');

/**
 * The interface object for working with the database.
 */
class DatabaseManager {

    recordCustomer(customerInfo, giveDiscount) {
        return new Promise((resolve, reject) => {
            this.models_[lit.tables.CUSTOMERS].create({gameCompleted: giveDiscount}).then(customer => {
                return customer.createDemographic(customerInfo).then(() => {
                    if (!giveDiscount)
                        return resolve();
                    return this.generateDiscount(customer);
                });
            }).then(resolve).catch(reject);
        })
    }

    applyDiscount(discountCode, originalPrice, purchasedProducts) {
        return new Promise((resolve, reject) => {
            this.models_[lit.tables.DISCOUNTS].findById(discountCode).then(discount => {
                let discountAmount;
                if (discount.get(lit.fields.DISCOUNT.TYPE) === 'PercentageOff') {
                    discountAmount = discount.get(lit.fields.DISCOUNT.AMOUNT) * originalPrice / 100;
                } else {
                    discountAmount = discount.get(lit.fields.DISCOUNT.AMOUNT);
                }
                discount.update({redeemed: true}).then(() => {
                    return this.models_[lit.tables.CUSTOMERS].findById(discount.get('customerId'));
                }).then(customer => {
                    return customer.update({purchaseMade: true}).then(() => {
                        return customer.createVisit({amountSpent: originalPrice - discountAmount});
                    });
                }).then(visit => {
                    return this.models_[lit.tables.PRODUCTS].findAll(
                        {where: {name: {[Op.in]: purchasedProducts}}}).then(products => {
                            return visit.addProducts(products);
                    });
                }).then(resolve).catch(reject);
            })
        })
    }

    generateDiscount(customer) {
        return new Promise((resolve, reject) => {
            let discountTypes = ['PercentageOff', "AmountOff"];
            let code = randomstring.generate({length: 5, charset: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'});
            let fields = {};
            fields[lit.fields.DISCOUNT.CODE] = code;
            fields[lit.fields.DISCOUNT.TYPE] = discountTypes[Math.floor(Math.random()*2)];
            fields[lit.fields.DISCOUNT.AMOUNT] = fields[lit.fields.DISCOUNT.TYPE] === 'PercentageOff'?
                Math.floor(Math.random()*20) + 5 : Math.floor(Math.random()*30) + 10;
            this.models_[lit.tables.DISCOUNTS].create(fields).then(obj => {
                return customer.setDiscount(obj);
            }).then(() => {
                return resolve(fields);
            }).catch(reject);
        });
    }

    /**
     * The constructor initializes a database connection using Sequelize
     */
    constructor() {
        this.connection_ = new Sequelize(config.db_config[lit.DB_DATABASE],
            config.db_config[lit.DB_USERNAME], config.db_config[lit.DB_PASSWORD], {
                host: config.db_config[lit.DB_HOST],
                port: config.db_config[lit.DB_PORT],
                pool: {
                    max: config.db_config[lit.DB_CONNECTION_LIMIT]
                },
                dialect: 'mysql',
                operatorsAliases: false
            });
        this.models_ = {};
        let con = this.connection_;
        _.each(tables, (value, key, obj) => {
            let table = obj[key];
            if (!table.hasOwnProperty('table_name')) return;
            this.models_[table.table_name] = con.define(table.table_name, table.fields, {timestamps: false});
        });
        _.each(tables, (value, key, obj) => {
            if ('associations' in value) {
                obj[key].associations(this.models_);
            }
        });
    }

    /**
     * updates the schema of the database.
     * @returns {Promise}
     */
    sync() {
        return this.connection_.sync();
    }
}

module.exports = DatabaseManager;