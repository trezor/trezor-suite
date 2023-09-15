var isNode = typeof module !== 'undefined' && typeof module.exports !== 'undefined'

var chai = isNode ? require('chai') : window.chai,
    expect = chai.expect

var WAValidator = isNode ? require('../src/wallet_address_validator') : window.WAValidator

describe('WAValidator.getCurrencies()', function () {
    it('Should get all currencies', function () {
        var currencies = WAValidator.getCurrencies();
        expect(currencies).to.be.ok;
        expect(currencies.length).to.be.greaterThan(0);
    });

    it('Should find a specific currency by symbol', function() {
        var currency = WAValidator.findCurrency('xrp');
        expect(currency).to.be.ok;
        expect(currency.name).to.equal('Ripple');
        expect(currency.symbol).to.equal('xrp');
    });

    it('Should find a specific currency by name', function() {
        var currency = WAValidator.findCurrency('Ripple');
        expect(currency).to.be.ok;
        expect(currency.name).to.equal('Ripple');
        expect(currency.symbol).to.equal('xrp');
    });

    it('Should return null if currency is not found', function() {
        var currency = WAValidator.findCurrency('random');
        expect(currency).to.be.null;
    });
});
