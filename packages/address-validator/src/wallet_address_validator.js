var currencies = require('./currencies');
const { addressType } = require('./crypto/utils');

var DEFAULT_CURRENCY_NAME = 'bitcoin';

module.exports = {
    validate: function (address, currencyNameOrSymbol, networkType) {
        var currency = currencies.getByNameOrSymbol(currencyNameOrSymbol || DEFAULT_CURRENCY_NAME);

        if (currency && currency.validator) {
            return currency.validator.isValidAddress(address, currency, networkType);
        }

        throw new Error('Missing validator for currency: ' + currencyNameOrSymbol);
    },
    getAddressType: function(address, currencyNameOrSymbol, networkType) {
        var currency = currencies.getByNameOrSymbol(currencyNameOrSymbol || DEFAULT_CURRENCY_NAME);
        if (!currency || !currency.validator) {
            throw new Error('getAddressType: No validator for currency' + currencyNameOrSymbol);
        }
        if (currency && currency.validator && currency.validator.getAddressType) {
            return currency.validator.getAddressType(address, currency, networkType);
        }
        throw new Error('getAddressType not defined for currency: ' + currencyNameOrSymbol);
    },
    getCurrencies: function () {
        return currencies.getAll();
    },
    findCurrency: function(symbol) {
        return currencies.getByNameOrSymbol(symbol) || null ;
    },
    addressType,
};
