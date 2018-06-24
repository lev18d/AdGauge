/**
 * @fileoverview setup code for the server
 * @author astral.cai@queensu.ca (Astral Cai)
 */

"use strict";

const dbsetup = require('./setup/db_setup');

setup().then(() => {
    console.log("setup completed!");
}).catch((err) => {
    console.log(err);
});

function setup() {
    return new Promise((resolve, reject) => {
        dbsetup().then((res) => {
            console.log(res);
            resolve();
        }).catch(reject);
    });
}