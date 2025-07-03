const { addressType } = require('./crypto/utils');
var currencies = require('./currencies');

var DEFAULT_CURRENCY_NAME = 'bitcoin';

module.exports = {
    validate (address, currencyNameOrSymbol, networkType) {
        var currency = currencies.getByNameOrSymbol(currencyNameOrSymbol || DEFAULT_CURRENCY_NAME);

        if (currency && currency.validator) {
            return currency.validator.isValidAddress(address, currency, networkType);
        }

        throw new Error('Missing validator for currency: ' + currencyNameOrSymbol);
    },
    getAddressType (address, currencyNameOrSymbol, networkType) {
        var currency = currencies.getByNameOrSymbol(currencyNameOrSymbol || DEFAULT_CURRENCY_NAME);
        if (!currency || !currency.validator) {
            throw new Error('getAddressType: No validator for currency' + currencyNameOrSymbol);
        }
        if (currency && currency.validator && currency.validator.getAddressType) {
            return currency.validator.getAddressType(address, currency, networkType);
        }
        throw new Error('getAddressType not defined for currency: ' + currencyNameOrSymbol);
    },
    getCurrencies () {
        return currencies.getAll();
    },
    findCurrency (symbol) {
        return currencies.getByNameOrSymbol(symbol) || null;
    },
    addressType,
};
