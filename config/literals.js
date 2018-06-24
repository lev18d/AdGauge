const tableNames = {
    CUSTOMERS: 'Customers',
    DEMOGRAPHICS: 'Demographics',
    VISITS: 'Visits',
    PRODUCTS: 'Products',
    DISCOUNTS: 'Discounts'
};

const fieldNames = {
    CUSTOMER: {
        ID: 'Id',
        VISIT_TIME: 'timeOfVisit',
        GAME_COMPLETED: 'gameCompleted',
        DISCOUNT_GIVEN: 'discountCodeGiven',
        PURCHASE_MADE: 'purchaseMade',

        DEMOGRAPHIC_ID: 'Id',
        GENDER: 'gender',
        AGE: 'age',
        ETHNICITY: 'ethnicity'
    },
    VISIT: {
        ID: 'Id',
        TIME: 'timeOfVisit',
        MONEY_SPENT: 'amountSpent'
    },
    PRODUCT: {
        ID: 'Id',
        NAME: 'name',
        PRICE: 'price',
        CATEGORY: 'category'
    },
    DISCOUNT: {
        CODE: 'discountCode',
        REDEEMED: 'redeemed',
        TYPE: 'discountType',
        AMOUNT: 'discountAmount'
    }
};

const literals = {
    // literals for table and field names
    tables: tableNames,
    fields: fieldNames,

    // configuration literals
    DB_HOST: 'host',
    DB_PORT: 'port',
    DB_DATABASE: 'database',
    DB_USERNAME: 'username',
    DB_PASSWORD: 'password',
    DB_CONNECTION_LIMIT: 'connectionLimit'
};

module.exports = literals;