var isNode = typeof module !== 'undefined' && typeof module.exports !== 'undefined'

var chai = isNode ? require('chai') : window.chai,
    expect = chai.expect

    console.log('isNode', isNode)
var WAValidator = isNode ? require('../src/wallet_address_validator') : window.WAValidator;

const addressType =  WAValidator.addressType;
console.log('dator.addressType',WAValidator.addressType)
function isValidAddressType(address, currency, networkType, addressType) {
    const type = WAValidator.getAddressType(address, currency, networkType);
    expect({ address, addressType: type }).to.deep.equal({address, addressType});
}

function valid(address, currency, networkType) {
    var valid = WAValidator.validate(address, currency, networkType);
    expect({ address, currency, valid }).to.deep.equal({ address, currency, valid: true });
}

function invalid(address, currency, networkType) {
    var valid = WAValidator.validate(address, currency, networkType);
    expect({ address, currency, valid }).to.deep.equal({ address, currency, valid: false });
}

describe('WAValidator.validate()', function () {
    describe('valid results', function () {
        it.only('should return true for correct bitcoin addresses', function () {
            // valid('12KYrjTdVGjFMtaxERSk3gphreJ5US8aUP', 'bitcoin');
            // valid('12QeMLzSrB8XH8FvEzPMVoRxVAzTr5XM2y', 'bitcoin');
            // valid('12QeMLzSrB8XH8FvEzPMVoRxVAzTr5XM2y', 'BTC');
            // valid('12QeMLzSrB8XH8FvEzPMVoRxVAzTr5XM2y', 'Bitcoin');
            // valid('12QeMLzSrB8XH8FvEzPMVoRxVAzTr5XM2y', 'btc');
            // valid('12QeMLzSrB8XH8FvEzPMVoRxVAzTr5XM2y', 'btc', 'prod');
            // valid('12QeMLzSrB8XH8FvEzPMVoRxVAzTr5XM2y', 'btc', 'both');
            // valid('15uwigGExiNQxTNr1QSZYPXJMp9Px2YnVU', 'btc', 'prod');
            // valid('3FyVFsEyyBPzHjD3qUEgX7Jsn4tcHNZFkn', 'btc', 'prod');
            // valid('38mKdURe1zcQyrFqRLzR8PRao3iLGEPVsU', 'btc', 'prod');
            // valid('mptPo5AvLzJXi4T82vR6g82fT5uJ6HsQCu', 'btc', 'both');
            // valid('1oNLrsHnBcR6dpaBpwz3LSwutbUNkNSjs', 'bitcoin');
            // valid('mzBc4XEFSdzCDcTxAgf6EZXgsZWpztRhef', 'bitcoin', 'testnet');
            // valid('mzBc4XEFSdzCDcTxAgf6EZXgsZWpztRhef', 'bitcoin', 'both');

            // valid('1SQHtwR5oJRKLfiWQ2APsAd9miUc4k2ez');
            // valid('116CGDLddrZhMrTwhCVJXtXQpxygTT1kHd');

            // // p2sh addresses
            // valid('3NJZLcZEEYBpxYEUGewU4knsQRn1WM5Fkt');
            // valid('3NJZLcZEEYBpxYEUGewU4knsQRn1WM5Fkt', 'bitcoin');
            // valid('2MxKEf2su6FGAUfCEAHreGFQvEYrfYNHvL7', 'bitcoin', 'testnet');

            // // regtest
            // valid('mvbu1Gdy8SUjTenqerxUaZyYjmveZvt33q', 'bitcoin', 'regtest');
            // valid('ms1B699PA2tAfHTFTwN12Tzxa933WpmuHX', 'bitcoin', 'regtest');
            // valid('2N4Q5FhU2497BryFfUgbqkAJE87aKHUhXMp', 'bitcoin', 'regtest');
            // valid('GSa5espVLNseXEfKt46zEdS6jrPkmFghBU', 'bitcoin', 'regtest');

            // valid('bcrt1q8zx9dlztqz9apm7y5gtx8a0tlz57fhncycvun5', 'bitcoin', 'regtest');
            valid('bcrt1pzndg2aenknysnqs0d8gwhg54nqnc6yut2c6as76h4tyqhr8spr6slpjy3x', 'bitcoin', 'regtest');

            // // segwit addresses
            // valid('BC1QW508D6QEJXTDG4Y5R3ZARVARY0C5XW7KV8F3T4', 'bitcoin');
            // invalid('bc1pw508d6qejxtdg4y5r3zarvary0c5xw7kw508d6qejxtdg4y5r3zarvary0c5xw7k7grplx', 'bitcoin'); // valid, but unspendable
            // invalid('BC1SW50QA3JX3S', 'bitcoin'); // valid, but unspendable
            // invalid('bc1zw508d6qejxtdg4y5r3zarvaryvg6kdaj', 'bitcoin'); // valid, but unspendable
            // invalid('bc1sw50qgdz25j', 'bitcoin', 'prod'); // valid, but unspendable
            // valid('tb1qqqqqp399et2xygdj5xreqhjjvcmzhxw4aywxecjdzew6hylgvsesrxh6hy', 'bitcoin', 'testnet');

            // valid('tb1qrp33g0q5c5txsp9arysrx4k6zdkfs4nce4xj0gdcccefvpysxf3q0sl5k7', 'bitcoin', 'testnet'); // lowercase L
            // invalid("tb1qrp33g0q5c5txsp9arysrx4k6zdkfs4nce4xj0gdcccefvpysxf3q0sL5k7", 'bitcoin', 'testnet'); // capital L

            // invalid("tc1qw508d6qejxtdg4y5r3zarvary0c5xw7kg3g4ty", 'bitcoin');
            // invalid("bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t5", 'bitcoin');
            // invalid("BC13W508D6QEJXTDG4Y5R3ZARVARY0C5XW7KN40WF2", 'bitcoin');
            // invalid("bc1rw5uspcuh", 'bitcoin');
            // invalid("bc10w508d6qejxtdg4y5r3zarvary0c5xw7kw508d6qejxtdg4y5r3zarvary0c5xw7kw5rljs90", 'bitcoin');
            // invalid("BC1QR508D6QEJXTDG4Y5R3ZARVARYV98GJ9P", 'bitcoin');
            // invalid("bc1zw508d6qejxtdg4y5r3zarvaryvqyzf3du", 'bitcoin');
            // invalid("tb1qrp33g0q5c5txsp9arysrx4k6zdkfs4nce4xj0gdcccefvpysxf3pjxtptv", 'bitcoin', 'testnet');
            // invalid("bc1gmk9yu", 'bitcoin');
        });

        it('should match the expected bitcoin address type', function () {
            isValidAddressType('1NSAR5mUUL3qZP29BfFj5jBPR5yWiiZZWi', 'bitcoin', 'prod', addressType.P2PKH);
            isValidAddressType('3CgkdgWwZ1RJGyHfcYnDe2qGTwaAtifeQw', 'bitcoin', 'prod', addressType.P2SH);
            isValidAddressType('bc1qwqdg6squsna38e46795at95yu9atm8azzmyvckulcc7kytlcckxswvvzej', 'bitcoin', 'prod', addressType.P2WSH);
            isValidAddressType('bc1qr0c0jscha3tzr7963zz4u2wsezsxvpzkwmrvhg', 'bitcoin', 'prod', addressType.P2WPKH);
            isValidAddressType('bc1p5cyxnuxmeuwuvkwfem96lqzszd02n6xdcjrs20cac6yqjjwudpxqkedrcr', 'bitcoin', 'prod', addressType.P2TR);
            isValidAddressType('bc1pqyqszqgpqyqszqgpqyqszqgpqyqszqgpqyqszqgpqyqszqgpqyqsyjer9e', 'bitcoin', 'prod', addressType.P2TR);
            isValidAddressType('BC1SW50QA3JX3S', 'bitcoin', 'prod', addressType.WITNESS_UNKNOWN); // bech32
            isValidAddressType('bc1sw50qgdz25j', 'bitcoin', 'prod', addressType.WITNESS_UNKNOWN); // bech32m ?
            isValidAddressType('bc1sw50qgdz25j', 'bitcoin', 'testnet', undefined);
            isValidAddressType('qwerty', 'bitcoin', 'prod', undefined);
            isValidAddressType('mvbu1Gdy8SUjTenqerxUaZyYjmveZvt33q', 'bitcoin', 'regtest', addressType.P2PKH);
            isValidAddressType('ms1B699PA2tAfHTFTwN12Tzxa933WpmuHX', 'bitcoin', 'regtest', addressType.P2PKH);
            isValidAddressType('2N4Q5FhU2497BryFfUgbqkAJE87aKHUhXMp', 'bitcoin', 'regtest', addressType.P2SH);
            isValidAddressType('GSa5espVLNseXEfKt46zEdS6jrPkmFghBU', 'bitcoin', 'regtest', addressType.P2SH);
            isValidAddressType('bcrt1q8zx9dlztqz9apm7y5gtx8a0tlz57fhncycvun5', 'bitcoin', 'regtest', addressType.P2WPKH);
            isValidAddressType('bcrt1pzndg2aenknysnqs0d8gwhg54nqnc6yut2c6as76h4tyqhr8spr6slpjy3x', 'bitcoin', 'regtest', addressType.P2TR);
        });

        it('should return true for correct bitcoincash addresses', function () {
            valid('bitcoincash:qq4v32mtagxac29my6gwj6fd4tmqg8rysu23dax807', 'bch');
            valid('bitcoincash:qp3wjpa3tjlj042z2wv7hahsldgwhwy0rq9sywjpyy', 'bch');
            valid('qp3wjpa3tjlj042z2wv7hahsldgwhwy0rq9sywjpyy', 'bch');
            valid('bitcoincash:qp3wjpa3tjlj042z2wv7hahsldgwhwy0rq9sywjpyy', 'bch', 'testnet');
            valid('qp3wjpa3tjlj042z2wv7hahsldgwhwy0rq9sywjpyy', 'bch', 'testnet');
        });

        it('should match the expected BCH address type', function () {
            isValidAddressType('bitcoincash:qq4v32mtagxac29my6gwj6fd4tmqg8rysu23dax807', 'bch', 'prod', addressType.ADDRESS);
            isValidAddressType('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', 'bch', 'prod', undefined);
            isValidAddressType('qp3wjpa3tjlj042z2wv7hahsldgwhwy0rq9sywjpyy', 'bch', 'prod', addressType.ADDRESS);
            isValidAddressType('bc1pqyqszqgpqyqszqgpqyqszqgpqyqszqgpqyqszqgpqyqszqgpqyqsyjer9e', 'bch', 'prod', undefined); // BTC address
        });

        it('should return true for correct litecoin addresses', function () {
            valid('LVg2kJoFNg45Nbpy53h7Fe1wKyeXVRhMH9', 'litecoin');
            valid('LVg2kJoFNg45Nbpy53h7Fe1wKyeXVRhMH9', 'LTC');
            valid('LTpYZG19YmfvY2bBDYtCKpunVRw7nVgRHW', 'litecoin');
            valid('Lb6wDP2kHGyWC7vrZuZAgV7V4ECyDdH7a6', 'litecoin');
            valid('mzBc4XEFSdzCDcTxAgf6EZXgsZWpztRhef', 'litecoin', 'testnet');

            // p2sh addresses
            valid('MUWheVyCBf3Fm3WNNXvotQ3Gj8NTSZCBVe', 'litecoin');

            valid('2MxKEf2su6FGAUfCEAHreGFQvEYrfYNHvL7', 'litecoin', 'testnet');
            valid('QW2SvwjaJU8LD6GSmtm1PHnBG2xPuxwZFy', 'litecoin', 'testnet');
            valid('QjpzxpbLp5pCGsCczMbfh1uhC3P89QZavY', 'litecoin', 'testnet');

            // segwit
            valid('ltc1qajkrze8gc5qdx2ehldsmd596a2gprnn50a53mj3xxvy0zgtdq6gqumv03a', 'litecoin');
        });

        it('should match the expected litecoin address type', function () {
            isValidAddressType('LVg2kJoFNg45Nbpy53h7Fe1wKyeXVRhMH9', 'litecoin', 'prod', addressType.P2PKH);
            isValidAddressType('ltc1qajkrze8gc5qdx2ehldsmd596a2gprnn50a53mj3xxvy0zgtdq6gqumv03a', 'litecoin', 'prod', addressType.P2WSH);
        });

        it('should return true for correct peercoin addresses', function () {
            valid('PHCEsP6od3WJ8K2WKWEDBYKhH95pc9kiZN', 'peercoin');
            valid('PSbM1pGoE9dnAuVWvpQqTTYVpKZU41dNAz', 'peercoin');
            valid('PUULeHrJL2WujJkorc2RsUAR3SardKUauu', 'peercoin');
            valid('PUULeHrJL2WujJkorc2RsUAR3SardKUauu', 'PPC');
            valid('mzBc4XEFSdzCDcTxAgf6EZXgsZWpztRhef', 'peercoin', 'testnet');

            // p2sh addresses
            valid('pNms4CaWqgZUxbNZaA1yP2gPr3BYnez9EM', 'peercoin');
            valid('2MxKEf2su6FGAUfCEAHreGFQvEYrfYNHvL7', 'peercoin', 'testnet');
        });

        it('should return true for correct dogecoin addresses', function () {
            valid('DPpJVPpvPNP6i6tMj4rTycAGh8wReTqaSU', 'dogecoin');
            valid('DNzLUN6MyYVS5zf4Xc2yK69V3dXs6Mxia5', 'dogecoin');
            valid('DPS6iZj7roHquvwRYXNBua9QtKPzigUUhM', 'dogecoin');
            valid('DPS6iZj7roHquvwRYXNBua9QtKPzigUUhM', 'DOGE');
            //TODO: NEED A DOGECOIN TESTNET ADDRESS

            //p2sh addresses
            valid('A7JjzK9k9x5b2MkkQzqt91WZsuu7wTu6iS', 'dogecoin');
            valid('2MxKEf2su6FGAUfCEAHreGFQvEYrfYNHvL7', 'dogecoin', 'testnet');
        });

        it('should match the expected dogecoin address type', function () {
            isValidAddressType('DMqRVLrhbam3Kcfddpxd6EYvEBbpi3bEpP', 'dogecoin', 'prod', addressType.P2PKH)
            isValidAddressType('A7JjzK9k9x5b2MkkQzqt91WZsuu7wTu6iS', 'dogecoin', 'prod', addressType.P2SH)
            isValidAddressType('qwerty', 'dogecoin', 'prod', undefined);
        });

        it('should return true for correct beavercoin addresses', function () {
            valid('BPPtB4EpPi5wCaGXZuNyKQgng8ya579qUh', 'beavercoin');
            valid('BC1LLYoE4mTCHTJhVYvLGxhRTwAHyWTQ49', 'beavercoin');
            valid('BBuyeg2vjtyFdMNj3LTxuVra4wJMKVAY9C', 'beavercoin');
            valid('BBuyeg2vjtyFdMNj3LTxuVra4wJMKVAY9C', 'BVC');
            valid('mzBc4XEFSdzCDcTxAgf6EZXgsZWpztRhef', 'beavercoin', 'testnet');

            // p2sh addresses
            valid('3NJZLcZEEYBpxYEUGewU4knsQRn1WM5Fkt', 'beavercoin');
            valid('2MxKEf2su6FGAUfCEAHreGFQvEYrfYNHvL7', 'beavercoin', 'testnet');
        });

        it('should return true for correct freicoin addresses', function () {
            valid('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', 'freicoin');
            valid('1oNLrsHnBcR6dpaBpwz3LSwutbUNkNSjs', 'freicoin');
            valid('1SQHtwR5oJRKLfiWQ2APsAd9miUc4k2ez', 'freicoin');
            valid('1SQHtwR5oJRKLfiWQ2APsAd9miUc4k2ez', 'FRC');
            valid('mzBc4XEFSdzCDcTxAgf6EZXgsZWpztRhef', 'freicoin', 'testnet');

            // p2sh addresse
            valid('3NJZLcZEEYBpxYEUGewU4knsQRn1WM5Fkt', 'freicoin');
            valid('2MxKEf2su6FGAUfCEAHreGFQvEYrfYNHvL7', 'freicoin', 'testnet');
        });

        it('should return true for correct protoshares addresses', function () {
            valid('PaNGELmZgzRQCKeEKM6ifgTqNkC4ceiAWw', 'protoshares');
            valid('Piev8TMX2fT5mFtgxx2TXJaqXP37weMPuD', 'protoshares');
            valid('PgsuLoe9ojRKFGJGVpqqk37gAqNJ4ozboD', 'protoshares');
            valid('PgsuLoe9ojRKFGJGVpqqk37gAqNJ4ozboD', 'PTS');
            valid('mzBc4XEFSdzCDcTxAgf6EZXgsZWpztRhef', 'protoshares', 'testnet');

            //p2sh addresses
            valid('3NJZLcZEEYBpxYEUGewU4knsQRn1WM5Fkt', 'protoshares');
            valid('2MxKEf2su6FGAUfCEAHreGFQvEYrfYNHvL7', 'protoshares', 'testnet');
        });

        it('should return true for correct megacoin addresses', function () {
            valid('MWUHaNxjXGZUYTh92i3zuDmsnH1rHSBk5M', 'megacoin');
            valid('MSAkrhRyte7bz999Ga5SqYjzypFFYa2oEb', 'megacoin');
            valid('MLUTAtDQFcfo1QACWocLuufFq5fBDTpCHE', 'megacoin');
            valid('MLUTAtDQFcfo1QACWocLuufFq5fBDTpCHE', 'MEC');
            valid('mzBc4XEFSdzCDcTxAgf6EZXgsZWpztRhef', 'megacoin', 'testnet');

            //p2sh addresses
            valid('3NJZLcZEEYBpxYEUGewU4knsQRn1WM5Fkt', 'megacoin');
            valid('2MxKEf2su6FGAUfCEAHreGFQvEYrfYNHvL7', 'megacoin', 'testnet');
        });

        it('should return true for correct primecoin addresses', function () {
            valid('AVKeiZ5JadfWdH2EYVgVRfX4ufoyd4ehuM', 'primecoin');
            valid('AQXBRPyob4dywUJ21RUKrR1xetQCDVenKD', 'primecoin');
            valid('ANHfTZnskKqaBU7oZuSha9SpbHU3YBfeKf', 'primecoin');
            valid('AYdiYMKSGYxLcZNDmqB8jNcck7SQibrfiK', 'primecoin');
            valid('AYdiYMKSGYxLcZNDmqB8jNcck7SQibrfiK', 'XPM');
            valid('mzBc4XEFSdzCDcTxAgf6EZXgsZWpztRhef', 'primecoin', 'testnet');

            //p2sh addresses
            valid('af5CvTQq7agDh717Wszb5QDbWb7nT2mukP', 'primecoin');
            valid('2MxKEf2su6FGAUfCEAHreGFQvEYrfYNHvL7', 'primecoin', 'testnet');
        });

        it('should return true for correct auroracoin addresses', function () {
            valid('ARM3GLZXF1PDTZ5vz3wh5MVahbK9BHTWAN', 'auroracoin');
            valid('AUtfc6ThCLb7FuEu7QPrWpJuaXaJRPciDF', 'auroracoin');
            valid('AUN1oaj5hjispGnczt8Aruw3TxgGyRqB3V', 'auroracoin');
            valid('AXGcBkGX6NiaDXj85C5dCrhTRUgwxSkKDK', 'auroracoin');
            valid('AXGcBkGX6NiaDXj85C5dCrhTRUgwxSkKDK', 'AUR');
            valid('mzBc4XEFSdzCDcTxAgf6EZXgsZWpztRhef', 'auroracoin', 'testnet');

            //p2sh addresses
            valid('3NJZLcZEEYBpxYEUGewU4knsQRn1WM5Fkt', 'auroracoin');
            valid('2MxKEf2su6FGAUfCEAHreGFQvEYrfYNHvL7', 'auroracoin', 'testnet');
        });

        it('should return true for correct namecoin addresses', function () {
            valid('NEpeRmS775fnti8TDgJA28m8KLEfNNRZvT', 'namecoin');
            valid('MyJ691bGJ48RBK2LS8n1U57wcFLFScFXxi', 'namecoin');
            valid('NFY9aw1RXLGtWpeqgNQXprnUcZXyKNinTh', 'namecoin');
            valid('NCPPc7Pzb75CpRPJQPRRh6ouJTq7BCy1H4', 'namecoin');
            valid('NCPPc7Pzb75CpRPJQPRRh6ouJTq7BCy1H4', 'NMC');
        });

        it('should return true for correct BioCoin addresses', function () {
            valid('B7xseoLGk7hEpMDDeSvZDKmmiAMHWiccok', 'biocoin');
            valid('B8zjmYFGhWmiaQSJshfrnefE72xCapCkvo', 'biocoin');
            valid('muH8LL42DiMs8GEQ6Grfi8KUw2uFvuKr1J', 'biocoin', 'testnet');
            valid('muH8LL42DiMs8GEQ6Grfi8KUw2uFvuKr1J', 'BIO', 'testnet');
            valid('B8zjmYFGhWmiaQSJshfrnefE72xCapCkvo', 'BIO');
        });

        it('should return true for correct Garlicoin addresses', function () {
            valid('GU2NtcNotWFiZjTp2Vdgf5CjeMfgsWYCua', 'garlicoin');
            valid('GNWeWaoQ6rv21ZFjJWT9vb91hXUzFTLkru', 'garlicoin');
            valid('mjKbQTkgwzmsL3J86tdVzhyW9pc4NePqTb', 'garlicoin', 'testnet');
            valid('mnYp36NuyRavMKQ9Q9Q6oGqoorAs9p3zYn', 'GRLC', 'testnet');
            valid('GU2NtcNotWFiZjTp2Vdgf5CjeMfgsWYCua', 'GRLC');
        });

        it('should return true for correct Vertcoin addresses', function () {
            valid('3PgeyhEJEnS5CeBu3iFcu3JHVKemeHx1AW', 'VTC');
            valid('353nERPQKhGj4WGzoiWcareA76TPgRCVNA', 'VTC');
            valid('376g4TmL8uQKFYsRFrbv5iz9srmb5bocEt', 'VTC');
            valid('3AMtM4Zk5oNHu9i4jDiwKB6Kg5YEReBsav', 'VTC');

            valid('VmoMjGf3zgZLy8sk3PMKd3xikZHXWvnYi7', 'vertcoin');
            valid('VmhHwXr3J8xMZpy62WuBGpu3xVvThWzcTQ', 'vertcoin');
            valid('mvww6DEJ18dbyQUukpVQXvLgrNDJazZn1Y', 'vertcoin', 'testnet');
            valid('mn3mdEE6cf1snxVsknNz4GRTdSrWXqYp7c', 'VTC', 'testnet');
            valid('Vri6Q4GgNFfdtcpxD961TotJwaSaYQCaL5', 'VTC');
            valid('vtc1qmzq3erafwvz23yfeu9tu45uz2kx3d7esk0rayg', 'VTC');
            valid('vtc1qhy8eqwqxpyryz4wctus36yl2uu60t0z6ecrvtc', 'VTC');
            valid('vtc1qh9y09s2crkp63mk26u3vrq9q4w3h8ee8gepjgw', 'VTC');
        });

        it('should return true for correct BitcoinGold addresses', function () {
            valid('GW3JrQyHtoVfEFES3Y9JagiX3VSKQStLwj', 'bitcoingold');
            valid('GUDWdeMyAXQbrNFFivAhkJQ1GfBCFdc7JF', 'bitcoingold');
            valid('mvww6DEJ18dbyQUukpVQXvLgrNDJazZn1Y', 'bitcoingold', 'testnet');
            valid('mn3mdEE6cf1snxVsknNz4GRTdSrWXqYp7c', 'BTG', 'testnet');
            valid('GSNFPRsdaM3MXrU5HW1AxgFwmUQC8HXK9F', 'BTG');
        });

        it('should return true for correct Decred addresses', function () {
            valid('Dsesax2GJnMN4wwmWo5rJGq73dDK217Rh85', 'DCR');
            valid('DsYuxtvGRfN8rncXAndtLUpJm55F77K17RA', 'decred');
            valid('DsaXDG2NrJW8g4tFAb8n9MNx81Sn3Qc8AEV', 'decred');
            valid('TsijUgejaRnLKF5WAbpUxNtwKGUiKVeXLr7', 'decred', 'testnet');
            valid('TsZ9QmAoadF12hGvyALp6qvaF4be3BmLqG9', 'dcr', 'testnet');
        });

        it('should return true for correct Digibyte addresses', function () {
            valid('DG2rM2orU2JH5i4ACh3AKNpRTNESdv5xf8', 'DGB');
            valid('DBR2Lj1F17eHGHXgbpae2Wb4m39bDyA1qo', 'DGB');
            valid('D9TDZTR9Z9Mx2NoDJnhqhnYhDLKRAmsL9n', 'digibyte');
            valid('DHRzA1YHA1kFWpz2apRckZJy6KZRyGq4EV', 'digibyte');
            valid('DJ53hTyLBdZp2wMi5BsCS3rtEL1ioYUkva', 'digibyte');
            valid('SRrevBM5bfZNpFJ4MhzaNfkTghYKoTB6LV', 'digibyte');
            valid('SckT6Snbv1WR2VYEuCh3upSPquHN57N314', 'digibyte');
        });

        it('should return true for correct Ethereum addresses', function () {
            valid('0xE37c0D48d68da5c5b14E5c1a9f1CFE802776D9FF', 'ethereum');
            valid('0xa00354276d2fC74ee91e37D085d35748613f4748', 'ethereum');
            valid('0xAff4d6793F584a473348EbA058deb8caad77a288', 'ETH');
            valid('0xc6d9d2cd449a754c494264e1809c50e34d64562b', 'ETH');
            valid('0x52908400098527886E0F7030069857D2E4169EE7', 'ETH');
            valid('0x8617E340B3D01FA5F11F306F4090FD50E238070D', 'ETH');
            valid('0xde709f2102306220921060314715629080e2fb77', 'ETH');
            valid('0x27b1fdb04752bbc536007a920d24acb045561c26', 'ETH');
            valid('0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed', 'ETH');
            valid('0xfB6916095ca1df60bB79Ce92cE3Ea74c37c5d359', 'ETH');
            valid('0xdbF03B407c01E7cD3CBea99509d93f8DDDC8C6FB', 'ETH');
            valid('0xD1220A0cf47c7B9Be7A2E6BA89F429762e7b9aDb', 'ETH');

            valid('0xD1220A0cf47c7B9Be7A2E6BA89F429762e7b9aDb', 'ethereumclassic');
            valid('0xD1220A0cf47c7B9Be7A2E6BA89F429762e7b9aDb', 'ETC');
            valid('0xD1220A0cf47c7B9Be7A2E6BA89F429762e7b9aDb', 'etherzero');
            valid('0xD1220A0cf47c7B9Be7A2E6BA89F429762e7b9aDb', 'ETZ');
            valid('0xD1220A0cf47c7B9Be7A2E6BA89F429762e7b9aDb', 'callisto');
            valid('0xD1220A0cf47c7B9Be7A2E6BA89F429762e7b9aDb', 'CLO');
        });

        it('should match the expected eip55 address type', function () {
            isValidAddressType('0xE37c0D48d68da5c5b14E5c1a9f1CFE802776D9FF', 'ethereum', 'prod', addressType.ADDRESS);
            isValidAddressType('0xD1220A0cf47c7B9Be7A2E6BA89F429762e7b9aDb', 'ethereumclassic', 'prod', addressType.ADDRESS);
        });

        it('should return true for correct Ripple addresses', function () {
            valid('rG1QQv2nh2gr7RCZ1P8YYcBUKCCN633jCn', 'ripple');
            valid('rG1QQv2nh2gr7RCZ1P8YYcBUKCCN633jCn', 'XRP');
            valid('r3kmLJN5D28dHuH8vZNUZpMC43pEHpaocV', 'XRP');
            valid('rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh', 'XRP');
            valid('rDTXLQ7ZKZVKz33zJbHjgVShjsBnqMBhmN', 'XRP');
        });

        it('should match the expected Ripple address type', function () {
            isValidAddressType('rG1QQv2nh2gr7RCZ1P8YYcBUKCCN633jCn', 'Ripple', 'prod', addressType.ADDRESS);
            isValidAddressType('rG1QQv2nh2gr7RCZ1P8YYcBUKCCN633jCN', 'Ripple', 'prod', undefined);
        });

        it('should return true for correct dash addresses', function () {
            valid('Xx4dYKgz3Zcv6kheaqog3fynaKWjbahb6b', 'dash');
            valid('XcY4WJ6Z2Q8w7vcYER1JypC8s2oa3SQ1b1', 'DASH');
            valid('XqMkVUZnqe3w4xvgdZRtZoe7gMitDudGs4', 'dash');
            valid('yPv7h2i8v3dJjfSH4L3x91JSJszjdbsJJA', 'dash', 'testnet');
            valid('XoAAqv3oUYZ6xRjX3brfbf9PotrGanS6Th', 'dash');
            valid('yP5oXZQXBfBf9FyfZDpFiKDypxuNUKUV2E', 'dash', 'testnet');
        });

        it('should return true for correct neo addresses', function () {
            valid('AR4QmqYENiZAD6oXe7ftm6eDcwtHk7rVTT', 'neo');
            valid('AKDVzYGLczmykdtRaejgvWeZrvdkVEvQ1X', 'NEO');
        });

        it('should return true for correct neo gas addresses', function () {
            valid('AR4QmqYENiZAD6oXe7ftm6eDcwtHk7rVTT', 'neogas');
        });

        it('should return true for correct qtum addresses', function () {
            valid('QNjUiD3bVVZwYTc5AhpeQbS1mfb2guyWhe', 'qtum');
            valid('QVZnSrMwKp6AL4FjUPPnfFgsma6j1DXQXu', 'QTUM');
            valid('MCgyroQse81wuv5RwPpY5DXDNxeafzLFJ8', 'QTUM');
            valid('QQYySVc5WEe3g6PnNFYmspqG5CfSG8rnma', 'QTUM');
            valid('MSvJQBJMZs1dhxz7UAWa2si4iyMD2FHQd5', 'QTUM');

            valid('qcSLSxN1sngCWSrKFZ6UC7ri4hhVSdq9SU', 'qtum', 'testnet');
            valid('qJnbEdrm9ybjVqDCaX5SWNBHmZy2X7YbPT', 'qtum', 'testnet');
            valid('qchBPDUYswobzpDmY5DsTStt74sTYQtaQv', 'qtum', 'testnet');
            valid('qbgHcqxXYHVJZXHheGpHwLJsB5epDUtWxe', 'qtum', 'testnet');
            valid('qZqqcqCsVtP2U38WWaUnwshHRpefvCa8hX', 'qtum', 'testnet');
        });

        it('should return true for correct votecoin addresses', function () {
            valid('t1U9yhDa5XEjgfnTgZoKddeSiEN1aoLkQxq', 'votecoin');
            valid('t3Vz22vK5z2LcKEdg16Yv4FFneEL1zg9ojd', 'VOT');
            valid('t2UNzUUx8mWBCRYPRezvA363EYXyEpHokyi', 'votecoin', 'testnet');
        });

        it('should return true for correct bitcoinz addresses', function () {
            valid('t1U9yhDa5XEjgfnTgZoKddeSiEN1aoLkQxq', 'bitcoinz');
            valid('t3Vz22vK5z2LcKEdg16Yv4FFneEL1zg9ojd', 'BTCZ');
            valid('t2UNzUUx8mWBCRYPRezvA363EYXyEpHokyi', 'bitcoinz', 'testnet');
        });

        it('should return true for correct zclassic addresses', function () {
            valid('t1U9yhDa5XEjgfnTgZoKddeSiEN1aoLkQxq', 'zclassic');
            valid('t3Vz22vK5z2LcKEdg16Yv4FFneEL1zg9ojd', 'ZCL');
            valid('t2UNzUUx8mWBCRYPRezvA363EYXyEpHokyi', 'zclassic', 'testnet');
        });

        it('should return true for correct hush addresses', function () {
            valid('t1U9yhDa5XEjgfnTgZoKddeSiEN1aoLkQxq', 'hush');
            valid('t3Vz22vK5z2LcKEdg16Yv4FFneEL1zg9ojd', 'HUSH');
            valid('t2UNzUUx8mWBCRYPRezvA363EYXyEpHokyi', 'hush', 'testnet');
        });

        it('should return true for correct zcash addresses', function () {
            valid('t1U9yhDa5XEjgfnTgZoKddeSiEN1aoLkQxq', 'zcash');
            valid('t3Vz22vK5z2LcKEdg16Yv4FFneEL1zg9ojd', 'ZEC');
            valid('t2UNzUUx8mWBCRYPRezvA363EYXyEpHokyi', 'zcash', 'testnet');
        });

        it('should return true for correct bitcoinprivate addresses', function () {
            valid('b1M4XXPFhwMb1SP33yhzn3h9qWXjujkgep4', 'bitcoinprivate');
            //valid('bx....', 'BTCP');
            //valid('nx....', 'bitcoinprivate', 'testnet');
        });

        it('should return true for correct snowgem addresses', function () {
            valid('s1fx7WBkjB4UH6qQjPp6Ysmtr1C1JiTK2Yw', 'snowgem');
            valid('s3d27MhkBRt3ha2UuxhjXaYF4DCnttTMnL1', 'SNG');
            valid('t2UNzUUx8mWBCRYPRezvA363EYXyEpHokyi', 'snowgem', 'testnet');
        });

        it('should return true for correct zencash addresses', function () {
            valid('znhiGGfYRepxkBjXYvA2kFrXiC351i9ta4z', 'zencash');
            valid('zssEdGnZCQ9G86LZFtbynMn1hYTVhn6eYCL', 'ZEN');
            valid('ztmWMDLWjbruCJxKmmfAZiT6QAQdiv5F291', 'zencash', 'testnet');
        });

        it('should return true for correct komodo addresses', function () {
            valid('R9R5HirAzqDcWrWGiJEL115dpV3QB3hobH', 'komodo');
            valid('RAvj2KKVUohTu3hVdNJ4U6hQi7TNawpacH', 'KMD');
            //valid('t2UNzUUx8mWBCRYPRezvA363EYXyEpHokyi', 'komodo', 'testnet');
        });

        it('should return true for correct Bankex addresses', function () {
            valid('0xeac39e1bc802baae3d4b9cb518f3f60374bbad6c', 'bankex');
            valid('0x45245bc59219eeaaf6cd3f382e078a461ff9de7b', 'BKX');
            valid('0xf40d80FCfa5cdEa0bB1E570c2D52132ac9bC6aEC', 'bankex', 'testnet');
            valid('0x8A7395f281EeCf2B471B689E87Cf4C7fa8bb957d', 'BKX', 'testnet');
        });

        it('should return true for correct Cardano addresses', function () {
            valid('Ae2tdPwUPEYxYNJw1He1esdZYvjmr4NtPzUsGTiqL9zd8ohjZYQcwu6kom7', 'cardano');
            valid('DdzFFzCqrhsfdzUZxvuBkhV8Lpm9p43p9ubh79GCTkxJikAjKh51qhtCFMqUniC5tv5ZExyvSmAte2Du2tGimavSo6qSgXbjiy8qZRTg', 'ada');
            valid('Ae2tdPwUPEZKmwoy3AU3cXb5Chnasj6mvVNxV1H11997q3VW5ihbSfQwGpm', 'ada');
            valid('4swhHtxKapQbj3TZEipgtp7NQzcRWDYqCxXYoPQWjGyHmhxS1w1TjUEszCQT1sQucGwmPQMYdv1FYs3d51KgoubviPBf', 'cardano');
            valid('addr1qxnv5u3vrx2t37h3u27qd5ukgcjmrl4f8mu9f5sza3h20cxsfjh80un9kvlggfcdw8fp5kqp9tztqnee9msd0qsafhdsyqclvk', 'cardano');
            valid('ADDR1QXNV5U3VRX2T37H3U27QD5UKGCJMRL4F8MU9F5SZA3H20CXSFJH80UN9KVLGGFCDW8FP5KQP9TZTQNEE9MSD0QSAFHDSYQCLVK', 'cardano');
            valid('addr1qxclz0u9guazk70l9vv3xf67wx3psx3dekasvy43xfvz56qcs6f7ssw2x0fcesudyj8h224rnzkae2lqlnw8f3353t3sjggfx0', 'cardano');
            valid(
                "addr_test1qru5ktsj5zsmhvwv0ep9zuhfu39x3wyt9wxjnsn3cagsyy59ckxhkvuc5xj49rw6zrp443wlygmhv8gwcu38jk6ms6usqd9a9q", 'cardano', 'testnet'
            );
        });

        it('should match the expected Cardano address type - mainnet', function () {
            isValidAddressType('Ae2tdPwUPEYxYNJw1He1esdZYvjmr4NtPzUsGTiqL9zd8ohjZYQcwu6kom7', 'cardano', 'prod', addressType.ADDRESS);
        });

        it('should match the expected Cardano address type - testnet', function () {
            isValidAddressType('addr_test1qru5ktsj5zsmhvwv0ep9zuhfu39x3wyt9wxjnsn3cagsyy59ckxhkvuc5xj49rw6zrp443wlygmhv8gwcu38jk6ms6usqd9a9q', 'cardano', 'testnet', addressType.ADDRESS);
        });

        it('should return true for correct monero addresses', function () {
            valid('47zQ5LAivg6hNCgijXSEFVLX7mke1bgM6YGLFaANDoJbgXDymcAAZvvMNt2PmMpqEe5qRy2zyfMYXdwpmdyitiFh84xnPG2', 'monero');
            valid('48bWuoDG75CXMDHbmPEvUF2hm1vLDic7ZJ7hqRkL65QR9p13AQAX4eEACXNk4YP115Q4KRVZnAvmMBHrcGfv9FvKPZnH6vH', 'XMR');
            valid('A2be3UvzMtkJtxRYgcCbQt2y7Rp2eLVGqNTWfZeankrWimSMM4y7uMP6B9oAZaHsXTj8KFSerkSkkVRuEuEca9QM8VhxCNU', 'monero', 'testnet');

            //integrated addresses
            valid('4Gd4DLiXzBmbVX2FZZ3Cvu6fUaWACup1qDowprUCje1kSP4FmbftiJMSfV8kWZXNqmVwj4m52xqtgFNUudVmsmGkGvkLcCibWfVUfUFVB7', 'monero');
            valid('4J5sF94AzXgFgx8LuWc9dcWkJkGkD3cL3L2AuhX6QA9jFvSxxj6QhHqHXqM2b2Go7G8RyDzEbHxYd9G26XUUbuJChipEyBz9fENMU2Ua9b', 'XMR');

            // subaddress
            valid('8A9XmWsATrhfedtNhTMNKELwfCwMVAk2iVTdUJdFRb2AC4tV4VeBjsCLYR9cSQTwnvLo4MAuQFMLP6Si4xp6t6BS788db3t', 'monero');
            valid('87i7kA61fNvMboXiYWHVygPAggKJPETFqLXXcdH4mQTrECvrTxZMtt6e6owj1k8jUVjNR11eBuBMWHFBtxAwEVcm9dcSUxr', 'xmr');
        });

        it('should match the expected monero address type', function () {
            isValidAddressType('47zQ5LAivg6hNCgijXSEFVLX7mke1bgM6YGLFaANDoJbgXDymcAAZvvMNt2PmMpqEe5qRy2zyfMYXdwpmdyitiFh84xnPG2', 'xmr', 'prod', addressType.ADDRESS);
            isValidAddressType('44643dtxcxjgMWEQLo6mh1c4d9Zxx9GbgK9hEj9iGSiFEryCkbwHyJ3JqxZJRqeC3Hb7ZBLKq5NkaJwR1x95EYnR1bTgN6d', 'Monero', 'prod', undefined);
        });

        it('should return true for correct gamecredits addresses', function () {
            valid('GU5BBtW9gxSKvAknvFi9yUaXKUNW9zUN2p', 'game');
            valid('GYxQMVzP6YpzX59QNRYqmJeHNtUMYSZPri', 'game');
        });

        it('should return true for correct monacoin addresses', function () {
            valid('MMN1Q1aRVUzanmg9DJjcRYzQSJQoBeQPui', 'mona');
            valid('PFMzNYnBm5X4c9qJkJPkfgdCyd9fuuy2vT', 'mona');
            valid('PCtN7VUYHW8w4g59BaphrfPs8g7pNgAzxn', 'mona');
            valid('MXCcYFGRmsd4d3CcQugFiqG8uarj5tVu76', 'mona');
            valid('MNK1pGsBf9WdoE54fZM9VFhkeYHW6VUf2u', 'mona');
        });

        it('should return true for correct pivx addresses', function () {
            valid('DJXFW9oJJBUX7QKrG6GKvmTs63MYKzwtpZ', 'pivx');
            valid('DEaYb8EHQgyKvX6VXDS3DZQautJrHBmK3T', 'pivx');
            valid('DDeCGR3QSgqsBxVR23bJvteiyYE34ZmxAc', 'pivx');
            valid('DSqQM8DPpBHHoZXHgRdwmaf6hZPEoZcFkh', 'pivx');
        });

        it('should return true for correct solarcoin addresses', function () {
            valid('8VxVLzwB26E2YZZ82o1NcQe96QSM2z6GwW', 'slr');
            valid('8YW5qcTjeyqX5kESsqu2BUdXiedgssegtQ', 'SolarCoin');
        });

        it('should return true for correct tether addresses', function () {
            valid('3MbYQMMmSkC3AgWkj9FMo5LsPTW1zBTwXL', 'usdt');
            valid('1KdXaqcBeoMAFVAPwTmYvDbEq6RnvNPF6J', 'tether');
        });

        it('should return true for correct expanse addresses', function () {
            valid('0xbab463743603a253bdf1f84975b1a9517505ae05', 'exp');
            valid('0x5d0777cb5d6977873904864c6ab531f4b3261f0b', 'expanse');
        });

        it('should return true for correct waves addresses', function () {
            valid('3P93mVrYnQ4ahaRMYwA2BeWY32eDxTpLVEs', 'waves');
            valid('3P4eeU7v1LMHQFwwT2GW9W99c6vZyytHajj', 'waves');

            valid('3Myrq5QDgRq3nBVRSSv9UYrP36xTtpJND5y', 'waves', 'testnet');
            valid('3My3KZgFQ3CrVHgz6vGRt8687sH4oAA1qp8', 'waves', 'testnet');
        });

        it('should return true for correct nano addresses', function () {
            valid('xrb_3t6k35gi95xu6tergt6p69ck76ogmitsa8mnijtpxm9fkcm736xtoncuohr3', 'nano');
            valid('xrb_13ezf4od79h1tgj9aiu4djzcmmguendtjfuhwfukhuucboua8cpoihmh8byo', 'nano');
            valid('xrb_35jjmmmh81kydepzeuf9oec8hzkay7msr6yxagzxpcht7thwa5bus5tomgz9', 'nano');
            valid('xrb_1111111111111111111111111111111111111111111111111111hifc8npp', 'nano');
            valid('xrb_1ipx847tk8o46pwxt5qjdbncjqcbwcc1rrmqnkztrfjy5k7z4imsrata9est', 'nano');
            valid('xrb_3wm37qz19zhei7nzscjcopbrbnnachs4p1gnwo5oroi3qonw6inwgoeuufdp', 'nano');
            valid('xrb_3arg3asgtigae3xckabaaewkx3bzsh7nwz7jkmjos79ihyaxwphhm6qgjps4', 'nano');
            valid('xrb_1f5e4w33ndqbkx4bw5jtp13kp5xghebfxcmw9hdt1f7goid1s4373w6tjmgu', 'nano');
            valid('xrb_1q79ahdr36uqn38p5tp5sqwkn73rnpj1k8obtuetdbjcx37d5gahhd1u9cuh', 'nano');
            valid('nano_1q79ahdr36uqn38p5tp5sqwkn73rnpj1k8obtuetdbjcx37d5gahhd1u9cuh', 'nano');
        });

        it('should return true for correct Aeternity addresses', () => {
            valid('ak_AT2bs7LkqwKbPUj5waoqq1E7QYgRzXUbaBanDHXDVsaCJ8gRA', 'ae')
            valid('ak_8QxnP9qXP3NpA4fskYZE7P1GfHzKZAMmoNuok7jJC5NqVYi21', 'ae')
        });

        it('should match the expected Aeternity address type', function () {
            isValidAddressType('ak_AT2bs7LkqwKbPUj5waoqq1E7QYgRzXUbaBanDHXDVsaCJ8gRA', 'ae', 'prod', addressType.ADDRESS);
        });

		it('should return true for correct Ardor addresses', () => {
            valid('ARDOR-HFNE-E2VE-SMV3-DCRZ8', 'ardr')
        });

		it('should return false for correct Ardor addresses', () => {
            invalid('AR-HFNE-E2VE-SMV3-DCRZ8', 'ardr')
        });

        it('should match the expected Ardor address type', function () {
            isValidAddressType('ARDOR-HFNE-E2VE-SMV3-DCRZ8', 'ardr', 'prod', addressType.ADDRESS);
            isValidAddressType('AR-HFNE-E2VE-SMV3-DCRZ8', 'ardr', 'prod', undefined);
        });

        it('should return true for correct siacoin addresses', function () {
            valid(
                'a9b01c85163638682b170d82de02b8bb99ba86092e9ab1b0d25111284fe618e93456915820f1',
                'siacoin'
            )
            valid(
                'a9b01c85163638682b170d82de02b8bb99ba86092e9ab1b0d25111284fe618e93456915820f1',
                'siacoin'
            )
            valid(
                'ab0c327982abfcc6055a6c9551589167d8a73501aca8769f106371fbc937ad100c955c3b7ba9',
                'siacoin'
            )
            valid(
                'ffe1308c044ade30392a0cdc1fd5a4dbe94f9616a95faf888ed36123d9e711557aa497530373',
                'siacoin'
            )
        });

        it('should match the expected Siacoin address type', function () {
            isValidAddressType('a9b01c85163638682b170d82de02b8bb99ba86092e9ab1b0d25111284fe618e93456915820f1', 'siacoin', 'prod', addressType.ADDRESS);
            isValidAddressType('aaaaaaaaaaaaaaa000000000000000', 'siacoin', 'prod', undefined);
        });

        it('should return true for correct BSC addresses', function () {
            valid('0x0590396689ee1d287147e9383fb8dd24532f2006', 'bsc');
            valid('0x07fc5c2bcaa0fa6bdaa4fff897490312c8f33c27', 'binance smart chain');
        });

        it('should return true for correct Cosmos addresses', () => {
            valid('cosmos1xxkueklal9vejv9unqu80w9vptyepfa95pd53u', 'atom')
        });

        it('should return false for incorrect Cosmos addresses', () => {
            invalid('cosmo15v50ymp6n5dn73erkqtmq0u8adpl8d3ujv2e74', 'atom')
            invalid('cosmos25v50ymp6n5dn73erkqtmq0u8adpl8d3ujv2e74', 'atom')
            invalid('cosmos15v50ymp6n5dn73erkQtmq0u8adpl8d3ujv2e74', 'atom')
        });

        it('should match the expected Cosmos address type', function () {
            isValidAddressType('cosmos1xxkueklal9vejv9unqu80w9vptyepfa95pd53u', 'atom', 'prod', addressType.ADDRESS);
            isValidAddressType('qwerty', 'atom', 'prod', undefined);
        });

        it('should return true for correct HashGraph addresses', () => {
            valid('0.0.10819', 'hbar')
            valid('0.0.13458', 'hbar')
            valid('0.0.16952', 'hbar')
        });

        it('should return true for incorrect HashGraph addresses', () => {
            invalid('1.0.10819', 'hbar')
        });

        it('should match the expected HBAR address type', function () {
            isValidAddressType('0.0.10819', 'hbar', 'prod', addressType.ADDRESS);
            isValidAddressType('1.0.10819', 'hbar', 'prod', undefined);
        });

        it('should return true for incorrect ICON addresses', () => {
            valid('hxf5a52d659df00ef0517921647516daaf7502a728', 'icx')
        });

        it('should return false for incorrect ICON addresses', () => {
            invalid('gxde8ba8fd110625a0c47ecf29de308b8f5bd20ed6', 'icx')
            invalid('hxde8ba8fd110625a0c47ecf29de308b8f5bd20eD6', 'icx')
        });

        it('should match the expected ICON address type', function () {
            isValidAddressType('hxf5a52d659df00ef0517921647516daaf7502a728', 'ICON', 'prod', addressType.ADDRESS);
            isValidAddressType('hxde8ba8fd110625a0c47ecf29de308b8f5bd20eD6', 'ICON', 'prod', undefined);
        });

        it('should return true for correct IOST addresses', () => {
            valid('binanceiost', 'iost')
        });

        it('should return true for correct IOST addresses', () => {
            invalid('rekt', 'iost')
        });

        it('should match the expected IOST address type', function () {
            isValidAddressType('binanceiost', 'IOST', 'prod', addressType.ADDRESS);
            isValidAddressType('rekt', 'IOST', 'prod', undefined);
        });

        // it('should return true for correct (M)IOTA addresses', () => {
        //     valid('ABFJCYEFHIV9XJY9XKDNYZGHBPYRYNFMUUNXAMZMFIEYSDKNHNEUSEXQYEWQTDNFETUNRSMEKJUCIKEEWFSWZYVFXD', 'iota')
        // });

        it('should return false for incorrect Ontology addresses', () => {
            invalid('AXu57dhdNDnA5drqJUM2KfoMqgaLwmZwow', 'ont');
            invalid('TNVv2v7eKL525gZ2YCmFnsB2FGNG4VeMHd', 'ont');
            invalid('TFYhfePLaZq2Y4BdKAnorm3XjjqTZcc9m4', 'ont');
            invalid('AecjxQsLGsSU3nmx92UuGGbF1fj7EsGrt2', 'ont');
        });

        it('should return false for incorrect Ravencoin addresses', () => {
            invalid('RFnM9d8sjAPn24yJi4VACWWWZjaYyFwd8k', 'rvn');
        });

        it('should return true for correct STEEM addresses', () => {
            valid('disconnect', 'steem');
        });

        it('should return false for incorrect STEEM addresses', () => {
            invalid('meet--crypto8', 'steem');
            invalid('me.etcrypto8', 'steem');
            invalid('met.8etcrypto8', 'steem');
            invalid('me', 'steem');
            invalid('.', 'steem');
        });

        it('should match the expected STEEM address type', function () {
            isValidAddressType('disconnect', 'steem', 'prod', addressType.ADDRESS);
            isValidAddressType('me', 'steem', 'prod', undefined);
        });

        it('should return true for correct Stratis addresses', () => {
            valid('SY7YwpMGvU42dkFzmFEkGWFr1BEikUwhPT', 'strat')
        });

        it('should return true for correct Verge addresses', () => {
            valid('D9HsosoCM6pxWU4UD3cgHFacmD18Fu34g5', 'xvg')
        });

        it('should return true for correct Zilliqa addresses', () => {
            valid('zil1pk6fe395e9lfkglv0m70daezm5en0t62hty7f7', 'zil')
        });

        it('should return false for incorrect Zilliqa addresses', () => {
            invalid('0xda816e2122a8a39b0926bfa84edd3d42477e9efE', 'zil')
        });

        it('should match the expected Zilliqa address type', function () {
            isValidAddressType('zil1pk6fe395e9lfkglv0m70daezm5en0t62hty7f7', 'zil', 'prod', addressType.ADDRESS);
            isValidAddressType('0xda816e2122a8a39b0926bfa84edd3d42477e9efE', 'zil', 'prod', undefined);
        });

        it('should return true for incorrect NXT addresses', () => {
            valid('NXT-799W-TN9C-GL3Q-D3PXU', 'nxt')
            valid('NXT-TMVC-69YC-SJB4-8YCH7', 'nxt')
        });

        it('should return false for incorrect NXT addresses', () => {
            invalid('NXT-799W-TN9C-GL3Q', 'nxt')
            invalid('NEXT-799W-TN9C-GL3Q', 'nxt')
        });

        it('should match the expected NXT address type', function () {
            isValidAddressType('NXT-799W-TN9C-GL3Q-D3PXU', 'NXT', 'prod', addressType.ADDRESS);
            isValidAddressType('NXT-799W-TN9C-GL3Q', 'NXT', 'prod', undefined);
        });

        it('should return true for correct VeChain addresses', () => {
            valid('0xA9E5617e2f90427F6db70A3B1d08Fc14706Eb907', 'ven')
            valid('0xb089B15A00528eEB19fcA4565df80d9a111BFCf9', 'ven')
        });

        it('should return true for correct VeChain Mainnet addresses', () => {
            valid('0x1374A7E9d5Ed5CFF9c56a0e57B3d8a836a378715', 'vet')
            valid('0x1374A7E9d5Ed5CFF9c56a0e57B3d8a836a378715', 'vet')
        });

        it('should return true for correct Syscoin addresses', () => {
            valid('SdzKyvhD2Y3xJvGVSfx96NXszq6x9BZX34', 'sys')
            valid('SSSBZDMVxuZyEMW4s6ar79Cf9UKqy6ZCwf', 'sys')
            valid('SUQ4gsnsTUeYJgTLsQ3siryr9HfHp95p12', 'sys')
            valid('SdzKyvhD2Y3xJvGVSfx96NXszq6x9BZX34', 'sys')
            valid('SbmNaK9hVn9BUoPoPtTmXogfGfZd5Mophm', 'sys')
            valid('SQUDdLog219Hpcz6Zss4uXg6xU1pAcnbLF', 'sys')
            valid('STxiBMedbmA28ip1QMooZaTBHxyiwVSCSr', 'sys')
            valid('SV4yxaugDJB6WXT5hNJwN1Pz6M8TjrMmJ6', 'sys')
        });

        it('should match the expected Syscoin address type', function () {
            isValidAddressType('sys1aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', 'sys', 'prod', addressType.ADDRESS);
            isValidAddressType('SdzKyvhD2Y3xJvGVSfx96NXszq6x9BZX34', 'sys', 'prod', addressType.ADDRESS);
            isValidAddressType('sus1aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', 'sys', 'prod', undefined);
        });

        it('should return true for correct loki addresses', function () {
            // public
            valid(
                'L63ymg8cb5aRz1PhXrEQ22PWw9KBhBS8rMsgqbABhTGFfh53U3Rc2iWCJpCPsHZT5hfyt7fPQa612a5Z1tBnGYEA9h6YHnn',
                'loki'
            )
            valid(
                'L5QKRGMNpQU3eCAdjMVTCR631bRKqnW1oEWWBEHAtFJLieA5VvuxyyubCd9FczEEatg8jfy39UJZ13npLJqZG6dtMtM99ha',
                'loki'
            )
            //   integrated
            valid(
                'LK8CGQ17G9R3ys3Xf33wCeViD2B95jgdpjAhcRsjuheJ784dumXn7g3RPAzedWpFq364jJKYL9dkQ8mY66sZG9BiD1xbPb6dpYo7toNRqk',
                'loki'
            )
            valid(
                'LK8CGQ17G9R3ys3Xf33wCeViD2B95jgdpjAhcRsjuheJ784dumXn7g3RPAzedWpFq364jJKYL9dkQ8mY66sZG9BiCtWq1AYo1oJTVqgUcQ',
                'loki'
            )
            valid(
                'LLhSDqBZdjLQWajr4pBcFkdjL8oGY7MDvfJkKfrQVaokfDMxU6bDVb6h8tsD1jpKpSXbbB1p8RxPbA7fmjvLGjicKLBdQvDMbHA7TWVCUQ',
                'loki'
            )
            //   subaddress
            valid(
                'LW1VMYcvWPZZJ2h1pKGEku2y9WeDiAU2VhgrgVgvjybaRuCdcEkg6FhXjVNSd37Bp7fhYH8tVa5T9VmRaYiWyxYdCpEGBg8',
                'loki'
            )
        })

        it('should return true for correct lbry addresses', function () {
            valid('bDb6NmobyDVeNGpizWQQBZkYjKCRQBdKdG', 'LBC')
            valid('bTFXPcV3a8iVDezogvHTHezWZ1mZGWpPDc', 'lbc')
            valid('bK2uEVn6UuwjCTUZ1Dfj5HhWYi9BtqZDDm', 'lbc')
            valid('bNEMVqeUZUqTrYUxud5ehnUhtTAiWDXQ5e', 'lbc')
        })

        it('should return true for correct trx addresses', function () {
            valid('TNDzfERDpxLDS2w1q6yaFC7pzqaSQ3Bg3r', 'trx');
            valid('27bLJCYjbH6MT8DBF9xcrK6yZnm43vx7MNQ', 'trx', 'testnet');
        });

        it('should return true for correct nem addresses', function () {
            valid('NBZMQO7ZPBYNBDUR7F75MAKA2S3DHDCIFG775N3D', 'xem');
            valid('TDWTRGT6GVWCV7GRWFNI45S53PGOJBKNUF3GE6PB', 'xem', 'testnet');
        });

        it('should match the expected NEM address type', function () {
            isValidAddressType('NBZMQO7ZPBYNBDUR7F75MAKA2S3DHDCIFG775N3D', 'NEM', 'prod', addressType.ADDRESS);
            isValidAddressType('TDWTRGT6GVWCV7GRWFNI45S53PGOJBKNUF3GE6PB', 'NEM', 'testnet', addressType.ADDRESS);
            isValidAddressType('TNDzfERDpxLDS2w1q6yaFC7pzqaSQ3Bg31', 'NEM', 'prod', undefined);
        });

        it('should return true for correct lsk addresses', function () {
            valid('469226551L', 'lsk');
            valid('15823701926930889868L', 'Lisk');
            valid('1657699692452120239L', 'lsk');
            valid('555666666999992L', 'lsk');
            valid('6853061742992593192L', 'lsk');
            valid('530464791801L', 'lsk');
        });

        it('should match the expected lsk address type', function () {
            isValidAddressType('469226551L', 'lsk', 'prod', addressType.ADDRESS);
            isValidAddressType('469226551l', 'lsk', 'prod', undefined);
        });

        it('should return true for correct bsv addresses', function () {
            valid('qzwryn9fxnpqkf7zt878tp2g9cg8kpl65qh2ml0w0r', 'bsv');
            valid('qp65yngy5uds4wxtrkynptal4f76qzmrh52pa3mpaf', 'bsv');
            valid('bitcoincash:qq4v32mtagxac29my6gwj6fd4tmqg8rysu23dax807', 'bsv');
            valid('qq4v32mtagxac29my6gwj6fd4tmqg8rysu23dax807', 'bsv');
            valid('qz97s7ee0rvwlymtxrwafmvs87x6027jwuf3wepug7', 'bsv');
            valid('bitcoincash:qpp32ssez340wfspnt79h6c4xds4fzf3m5j0cplx0l', 'bsv');
            valid('qqg82u7tq2eahs3gkh9m6kjnmjehr69m5v37alepq4', 'bsv');
            valid('bitcoincash:qrwkk9a3es2wu7mdvzh0vekfvjuzysq8tv7r3hcwr5', 'bsv');
            valid('1DrNXqCj2B8FKyx66RAWDkiEJhw2yrvhT3', 'bsv');
        });

        it('should match the expected bsv address type', function () {
            isValidAddressType('qzwryn9fxnpqkf7zt878tp2g9cg8kpl65qh2ml0w0r', 'bsv', 'prod', addressType.ADDRESS);

            // FIXME: this test fails (returns addressType.ADDRESS) - should it return undefined as it's a testnet address?
            // isValidAddressType('qzwryn9fxnpqkf7zt878tp2g9cg8kpl65qh2ml0w0r', 'bsv', 'testnet', undefined);

            isValidAddressType('qwerty', 'bsv', 'prod', undefined);
        });

        it('should return true for correct stellar addresses', function () {
            valid('GBBM6BKZPEHWYO3E3YKREDPQXMS4VK35YLNU7NFBRI26RAN7GI5POFBB', 'stellar');
            valid('GB7KKHHVYLDIZEKYJPAJUOTBE5E3NJAXPSDZK7O6O44WR3EBRO5HRPVT', 'stellar');
            valid('GD6WVYRVID442Y4JVWFWKWCZKB45UGHJAABBJRS22TUSTWGJYXIUR7N2', 'stellar');
            valid('GBCG42WTVWPO4Q6OZCYI3D6ZSTFSJIXIS6INCIUF23L6VN3ADE4337AP', 'stellar');
            valid('GDFX463YPLCO2EY7NGFMI7SXWWDQAMASGYZXCG2LATOF3PP5NQIUKBPT', 'stellar');
            valid('GBXEODUMM3SJ3QSX2VYUWFU3NRP7BQRC2ERWS7E2LZXDJXL2N66ZQ5PT', 'stellar');
            valid('GAJHORKJKDDEPYCD6URDFODV7CVLJ5AAOJKR6PG2VQOLWFQOF3X7XLOG', 'stellar');
            valid('GACXQEAXYBEZLBMQ2XETOBRO4P66FZAJENDHOQRYPUIXZIIXLKMZEXBJ', 'stellar');
            valid('GDD3XRXU3G4DXHVRUDH7LJM4CD4PDZTVP4QHOO4Q6DELKXUATR657OZV', 'stellar');
            valid('GDTYVCTAUQVPKEDZIBWEJGKBQHB4UGGXI2SXXUEW7LXMD4B7MK37CWLJ', 'stellar');
            valid('GDC5UWE3G6Z4KYOTET5NOCRIVBKWH7MOCSPZPHF4GHQ6XUDD27ACOACD', 'stellar');
        });

        it('should match the expected stellar address type', function () {
            isValidAddressType('GBBM6BKZPEHWYO3E3YKREDPQXMS4VK35YLNU7NFBRI26RAN7GI5POFBB', 'stellar', 'prod', addressType.ADDRESS);
            isValidAddressType('SBGWKM3CD4IL47QN6X54N6Y33T3JDNVI6AIJ6CD5IM47HG3IG4O36XCU', 'stellar', 'prod', undefined);
        });

        it('should return true for correct binance address', function () {
            valid('bnb1qfmufc2q30cgw82ykjlpfeyauhcf5mad6p5y8t', 'binance');
            valid('bnb1hcqaqelrpd30cvdrwamxw3g2u390qecz0zr9fr', 'binance');
            valid('bnb16hw73zvzmye7x58mqauagf82gd5d3stven24jk', 'binance');
            valid('bnb1xlvns0n2mxh77mzaspn2hgav4rr4m8eerfju38', 'binance');
            valid('bnb16hw73zvzmye7x58mqauagf82gd5d3stven24jk', 'bnb');
        });

        it('should return false for incorrect binance address', function () {
            invalid('lol1qfmufc2q30cgw82ykjlpfeyauhcf5mad6p5y8t', 'binance');
        });

        it('should return true for correct binance smart chain address', function () {
            valid('0x7ae2f5b9e386cd1b50a4550696d957cb4900f03a', 'bsc');
            valid('0x0000000000000000000000000000000000001000', 'Binance Smart Chain');
        });

        it('should return false for incorrect binance smart chain address', function () {
            invalid('bnb1xlvns0n2mxh77mzaspn2hgav4rr4m8eerfju38', 'bsc');
        });

        it('should return true for correct xtz(tezos) address', function () {
            valid('tz1Lhf4J9Qxoe3DZ2nfe8FGDnvVj7oKjnMY6', 'xtz');
            valid('tz1PyxsQ7xVTa5J7gtBeT7pST5Zi5nk5GSjg', 'xtz');
            valid('tz1LcuQHNVQEWP2fZjk1QYZGNrfLDwrT3SyZ', 'xtz');
            valid('tz1Lhf4J9Qxoe3DZ2nfe8FGDnvVj7oKjnMY6', 'xtz');
            valid('tz1RR6wETy9BeXG3Fjk25YmkSMGHxTtKkhpX', 'xtz');
            valid('tz1h3rQ8wBxFd8L9B3d7Jhaawu6Z568XU3xY', 'xtz');
            valid('KT1EM2LvxxFGB3Svh9p9HCP2jEEYyHjABMbK', 'xtz');
        });

        it('should match the expected xtz(tezor) address type', function () {
            isValidAddressType('tz1Lhf4J9Qxoe3DZ2nfe8FGDnvVj7oKjnMY6', 'xtz', 'prod', addressType.ADDRESS);
            isValidAddressType('tz1RR6wy9BeXG3Fjk25YmkSMGHxTtKkhpX', 'xtz', 'prod', undefined);
        });

        it('should return true for correct eos addresses', function () {
            valid('bittrexacct1', 'eos');
            valid('binancecleos', 'eos');
            valid('123456789012', 'eos');
        });

        it('should return true for incorrect eos addresses', function () {
            invalid('shitcoin', 'eos');
        });

        it('should match the expected EOS address type', function () {
            isValidAddressType('bittrexacct1', 'EOS', 'prod', addressType.ADDRESS);
            isValidAddressType('shitcoin', 'EOS', 'prod', undefined);
        });

    });

    describe('invalid results', function () {
        function commonTests(currency) {
            invalid('', currency); //reject blank
            invalid('%%@', currency); //reject invalid base58 string
            invalid('1A1zP1ePQGefi2DMPTifTL5SLmv7DivfNa', currency); //reject invalid address
            invalid('bd839e4f6fadb293ba580df5dea7814399989983', currency);  //reject transaction id's
            //testnet
            invalid('', currency, 'testnet'); //reject blank
            invalid('%%@', currency, 'testnet'); //reject invalid base58 string
            invalid('1A1zP1ePQGefi2DMPTifTL5SLmv7DivfNa', currency, 'testnet'); //reject invalid address
            invalid('bd839e4f6fadb293ba580df5dea7814399989983', currency, 'testnet');  //reject transaction id's
        }

        it('should return false for incorrect bitcoin addresses', function () {
            commonTests('bitcoin');

            // testnet in prod and prod in testnet
            invalid('mzBc4XEFSdzCDcTxAgf6EZXgsZWpztRhef', 'btc');
            invalid('12QeMLzSrB8XH8FvEzPMVoRxVAzTr5XM2y', 'bitcoin', 'testnet');

        });

        it('should return false for incorrect bitcoincash addresses', function () {
            commonTests('bitcoincash');
            invalid('12KYrjTdVGjFMtaxERSk3gphreJ5US8aUP', 'bitcoincash');
            invalid('12QeMLzSrB8XH8FvEzPMVoRxVAzTr5XM2y', 'bitcoincash');
            invalid('12QeMLzSrB8XH8FvEzPMVoRxVAzTr5XM2y', 'BCH');
            invalid('12QeMLzSrB8XH8FvEzPMVoRxVAzTr5XM2y', 'bch');
            invalid('12QeMLzSrB8XH8FvEzPMVoRxVAzTr5XM2y', 'bch', 'prod');
            invalid('12QeMLzSrB8XH8FvEzPMVoRxVAzTr5XM2y', 'bch', 'both');
            invalid('1oNLrsHnBcR6dpaBpwz3LSwutbUNkNSjs', 'bitcoincash');
            invalid('mzBc4XEFSdzCDcTxAgf6EZXgsZWpztRhef', 'bitcoincash', 'testnet');
            invalid('mzBc4XEFSdzCDcTxAgf6EZXgsZWpztRhef', 'bitcoincash', 'both');
            // p2sh addresses
            invalid('3NJZLcZEEYBpxYEUGewU4knsQRn1WM5Fkt', 'bitcoincash');
            invalid('2MxKEf2su6FGAUfCEAHreGFQvEYrfYNHvL7', 'bitcoincash', 'testnet');
            // bitcoincash
            invalid('bitcoincash:qp3wjpa3tjlj042z2wv7hahsldgwhwy0rq9sywjpyya', 'bch');
            invalid('qp3wjpa3tjlj042z2wv7hahsldgwhwy0rq9sywjpyya', 'bch');
        });

        it('should return false for incorrect litecoin addresses', function () {
            commonTests('litecoin');
            // do not allow old ltc addresses
            invalid('3NJZLcZEEYBpxYEUGewU4knsQRn1WM5Fkt', 'litecoin');
            invalid('vtc1qmzq3erafwvz23yabc9tu45uz2kx3d7esk0rayg', 'litecoin');
            invalid('ltc1qu7wq0evvgnmyyxcc7xhljavc7duu7js7jxhgjl0p390sy4udvtuq7361dl', 'litecoin');
        });

        it('should return false for incorrect peercoin addresses', function () {
            commonTests('peercoin');
        });

        it('should return false for incorrect dogecoin addresses', function () {
            commonTests('dogecoin');
        });

        it('should return false for incorrect beavercoin addresses', function () {
            commonTests('beavercoin');
        });

        it('should return false for incorrect freicoin addresses', function () {
            commonTests('freicoin');
        });

        it('should return false for incorrect protoshares addresses', function () {
            commonTests('protoshares');
        });

        it('should return false for incorrect megacoin addresses', function () {
            commonTests('megacoin');
        });

        it('should return false for incorrect primecoin addresses', function () {
            commonTests('primecoin');
        });

        it('should return false for incorrect auroracoin addresses', function () {
            commonTests('auroracoin');
        });

        it('should return false for incorrect namecoin addresses', function () {
            commonTests('namecoin');
        });

        it('should return false for incorrect biocoin addresses', function () {
            commonTests('biocoin');
        });

        it('should return false for incorrect garlicoin addresses', function () {
            commonTests('garlicoin');
        });

        it('should return false for incorrect vertcoin addresses', function () {
            commonTests('vertcoin');
            invalid('vtc1qmzq3erafwvz23yabc9tu45uz2kx3d7esk0rayg', 'vertcoin');
            invalid('vtc1qhy8eqwqxpyryz4wctus36yl2uu60t0z6ecrvt', 'vertcoin');
            invalid('vtd1qhy8eqwqxpyryz4wctus36yl2uu60t0z6ecrvtc', 'vertcoin');
        });

        it('should return false for incorrect bitcoingold addresses', function () {
            commonTests('bitcoingold');
        });

        it('should return false for incorrect decred addresses', function () {
            commonTests('decred');
        });

        it('should return false for incorrect gamecredits addresses', function () {
            commonTests('game');
        });

        it('should return false for incorrect monacoin addresses', function () {
            commonTests('mona');
        });

        it('should return false for incorrect solarcoin addresses', function () {
            commonTests('slr');
        });

        it('should return false for incorrect tether addresses', function () {
            commonTests('usdt');
        });

        it('should return false for incorrect expanse addresses', function () {
            commonTests('exp');
        });

        it('should return false for incorrect usdt addresses', function () {
            commonTests('usdt');
        });

        it('should return false for incorrect bankex addresses', function () {
            invalid('1SQHtwR5oJRKLfiWQ2APsAd9miUc4k2ez', 'bankex');
            invalid('116CGDLddrZhMrTwhCVJXtXQpxygTT1kHd', 'BKX');
            invalid('mzBc4XEFSdzCDcTxAgf6EZXgsZWpztRhef', 'bankex', 'testnet');
            invalid('mzBc4XEFSdzCDcTxAgf6EZXgsZWpztRhef', 'BKX', 'testnet');
        });

        it('should return false for incorrect digibyte addresses', function () {
            commonTests('digibyte');
        });

        it('should return false for incorrect eip55 addresses', function () {
            invalid('6xAff4d6793F584a473348EbA058deb8caad77a288', 'ethereum');
            invalid('0x02fcd51aAbB814FfFe17908fbc888A8975D839A5', 'ethereum');
            invalid('0XD1220A0CF47C7B9BE7A2E6BA89F429762E7B9ADB', 'ethereum');
            invalid('aFf4d6793f584a473348ebA058deb8caad77a2885', 'ethereum');
            invalid('0xff4d6793F584a473', 'ethereum');

            invalid('0x02fcd51aAbB814FfFe17908fbc888A8975D839A5', 'ethereumclassic');
            invalid('0x02fcd51aAbB814FfFe17908fbc888A8975D839A5', 'etherzero');
            invalid('0x02fcd51aAbB814FfFe17908fbc888A8975D839A5', 'callisto');
        });

        it('should return false for incorrect ripple addresses', function () {
            invalid('rG1QQv2nh2gr7RCZ1P8YYcBUKCCN633jCN', 'ripple');
            invalid('rDTXLQ7ZKZVKz33zJbHjgVShjsBnqMBhMN', 'XRP');
            invalid('6xAff4d6793F584a473348EbA058deb8ca', 'ripple');
            invalid('DJ53hTyLBdZp2wMi5BsCS3rtEL1ioYUkva', 'ripple');
        });

        it('should return false for incorrect dash addresses', function () {
            commonTests('dash');
        });

        it('should return false for incorrect neo addresses', function () {
            commonTests('neo');
            invalid('AR4QmqYENiZAD6oXe7ftm6eDcwtHk7rVTa', 'neo');
            invalid('AKDVzYGLczmykdtRaejgvWeZrvdkVEvQ10', 'NEO');
        });

        it('should return false for incorrect qtum addresses', function () {
            commonTests('qtum');
            invalid('QNPhBbVhDghASxcUh2vHotQUgNeLRFTcfb', 'qtum');
            invalid('QOPhBbVhDghASxcUh2vHotQUgNeLRFTcfa', 'QTUM');
            invalid('qZqqcqCsVtP2U38ABCUnwshHRpefvCa8hX', 'QTUM', 'testnet');
        });

        it('should return false for incorrect votecoin addresses', function () {
            commonTests('votecoin');
            invalid('t1Y9yhDa5XEjgfnTgZoKddeSiEN1aoLkQxq', 'votecoin');
            invalid('t3Yz22vK5z2LcKEdg16Yv4FFneEL1zg9ojd', 'VOT');
            invalid('t2YNzUUx8mWBCRYPRezvA363EYXyEpHokyi', 'votecoin', 'testnet');
        });

        it('should return false for incorrect bitcoinz addresses', function () {
            commonTests('bitcoinz');
            invalid('t1Y9yhDa5XEjgfnTgZoKddeSiEN1aoLkQxq', 'bitcoinz');
            invalid('t3Yz22vK5z2LcKEdg16Yv4FFneEL1zg9ojd', 'BTCZ');
            invalid('t2YNzUUx8mWBCRYPRezvA363EYXyEpHokyi', 'bitcoinz', 'testnet');
        });

        it('should return false for incorrect zclassic addresses', function () {
            commonTests('zclassic');
            invalid('t1Y9yhDa5XEjgfnTgZoKddeSiEN1aoLkQxq', 'zclassic');
            invalid('t3Yz22vK5z2LcKEdg16Yv4FFneEL1zg9ojd', 'ZCL');
            invalid('t2YNzUUx8mWBCRYPRezvA363EYXyEpHokyi', 'zclassic', 'testnet');
        });

        it('should return false for incorrect hush addresses', function () {
            invalid('t1Y9yhDa5XEjgfnTgZoKddeSiEN1aoLkQxq', 'hush');
            invalid('t3Yz22vK5z2LcKEdg16Yv4FFneEL1zg9ojd', 'HUSH');
            invalid('t2YNzUUx8mWBCRYPRezvA363EYXyEpHokyi', 'hush', 'testnet');
        });

        it('should return false for incorrect zcash addresses', function () {
            commonTests('zcash');
            invalid('t1Y9yhDa5XEjgfnTgZoKddeSiEN1aoLkQxq', 'zcash');
            invalid('t3Yz22vK5z2LcKEdg16Yv4FFneEL1zg9ojd', 'ZEC');
            invalid('t2YNzUUx8mWBCRYPRezvA363EYXyEpHokyi', 'zcash', 'testnet');
        });

        it('should return false for incorrect bitcoinprivate addresses', function () {
            commonTests('bitcoinprivate');
            invalid('b1Y4XXPFhwMb1SP33yhzn3h9qWXjujkgep4', 'bitcoinprivate');
            //invalid('bx....', 'BTCP');
            //invalid('nx....', 'bitcoinprivate', 'testnet');
        });

        it('should return false for incorrect snowgem addresses', function () {
            commonTests('snowgem');
            invalid('s1Yx7WBkjB4UH6qQjPp6Ysmtr1C1JiTK2Yw', 'snowgem');
            invalid('s3Y27MhkBRt3ha2UuxhjXaYF4DCnttTMnL1', 'SNG');
            invalid('t2YNzUUx8mWBCRYPRezvA363EYXyEpHokyi', 'snowgem', 'testnet');
        });

        it('should return false for incorrect zencash addresses', function () {
            commonTests('zencash');
            invalid('znYiGGfYRepxkBjXYvA2kFrXiC351i9ta4z', 'zencash');
            invalid('zsYEdGnZCQ9G86LZFtbynMn1hYTVhn6eYCL', 'ZEN');
            invalid('ztYWMDLWjbruCJxKmmfAZiT6QAQdiv5F291', 'zencash', 'testnet');
        });

        it('should return false for incorrect komodo addresses', function () {
            commonTests('komodo');
            invalid('R9Y5HirAzqDcWrWGiJEL115dpV3QB3hobH', 'komodo');
            invalid('RAYj2KKVUohTu3hVdNJ4U6hQi7TNawpacH', 'KMD');
            //invalid('t2YNzUUx8mWBCRYPRezvA363EYXyEpHokyi', 'komodo', 'testnet');
        });

        it('should return false for incorrect cardano addresses', function () {
            commonTests('cardano');
            invalid('Ae2tdPwUPEYxYNJw1He1esdZYvjmr4NtPzUsGTiqL9zd8ohjZYQcwu6lom7', 'cardano');
            invalid('DdzFFzCqrhsfdzUZxvuBkhV8Lpm9p43p9ubh79GCTkxJikAjKh51qhtCFMqUniC5tv5ZExyvSmAte2Du2tGimavSo6qSgXbjiy8qZRTg1', 'cardano');
            invalid('DdzFFzCqrhsfdzUZxvuBkhV8Lpm9p43p9ubh79GCTkxJikAjKh51qhtCFMqUniC5tv5ZExyvSmAte2Du2tGimavSo6qSgXbjiy8qZRT', 'ada');
            invalid('ADDR1qXNV5U3VRX2T37H3U27QD5UKGCJMRL4F8MU9F5SZA3H20CXSFJH80UN9KVLGGFCDW8FP5KQP9TZTQNEE9MSD0QSAFHDSYQCLVK', 'cardano');
            invalid('addr1qxnv5u3vrx2t37h3u27qd5ukgcjmrl4f8mu9f5sza3h20cxsfjh80un9kvlggfcdw8fp5kqp9tztqnee9msd0qsafhdsyqclvl', 'cardano');
            //invalid('t2YNzUUx8mWBCRYPRezvA363EYXyEpHokyi', 'komodo', 'testnet');
        });

        it('should return false for incorrect monero addresses', function () {
            commonTests('monero');
            invalid('4AWygwA3hHNE4e4Yr9PtRWJiorXTjZkCi57g4ExYzfXDFFQ8DRFEFyui1dLqVknpqQjGUBdTMbgaFAZaDbrVHdk3GAKBZ3E', 'monero');
            invalid('44643dtxcxjgMWEQLo6mh1c4d9Zxx9GbgK9hEj9iGSiFEryCkbwHyJ3JqxZJRqeC3Hb7ZBLKq5NkaJwR1x95EYnR1bTgN6d', 'xmr');
            invalid('A17N9ztrxjQD3v3JJtHGvHVnq6BAbujDNEuensB6PFwBYFpkjAicih8hDtX76HBuEag5NeaCuMZmRMe6eE5NMRGxFTQn8nJ', 'monero', 'testnet');

            //integrated
            invalid('4LNSCKNSTPNbJYkyAEgL966eHJHLDHiq1PpwKoiFBybcSqNGYfLBJApC62uQEeGAFxfYEd29uXBBrJFo7DhKqFVNi3GhmN79EtD5dgycYz', 'monero');
            invalid('4JpzTwf3i1GeCV76beVr19179oa8j1L8xNSC1bXMtAxxdf4aTTLqubL8EvXfQmUGKt9MMigFtKy91VtoTTSfg1LU7LocPruT6KcGC9RKJV', 'xmr');
        });

        it('should return false for incorrect waves addresses', function () {
            commonTests('waves');
            invalid('3P93mVrYnQ4ahaRMYwA2BeWY32eDxTpLVEs1', 'waves');
            invalid('3P4eeU7v1LMHQFwwT2GW9W99c6vZyytHaj', 'waves');
            invalid('2P93mVrYnQ4ahaRMYwA2BeWY32eDxTpLVEs', 'waves');

            invalid('3Myrq5QDgRq3nBVRSSv9UYRP36xTtpJND5y', 'waves', 'testnet');
            invalid('3My3KZgFQ3CrVHgz6vGRt8787sH4oAA1qp8', 'waves', 'testnet');
        });

        it('should return true for incorrect nano addresses', function () {
            valid('nano_1fnrrsrsifdpnkxrwwtfpjx5etcwt7a8hrz6fuqkh6w5i9jdsmo4yjg66iu7', 'nano');

        });

        it('should return false for incorrect nano addresses', function () {
            commonTests('nano');
            invalid('xrb_1f5e4w33ndqbkx4bw5jtp13kp5xghebfxcmw9hdt1f7goid1s4373w6tjdgu', 'nano');
            invalid('nano_1f5e4w33ndqbkx4bw5jtp13kp5xghebfxcmw9hdt1f7goid1s4373w6tjdgu', 'nano');
            invalid('xrb_1111111112111111111111111111111111111111111111111111hifc8npp', 'nano');
            invalid('nano_111111111111111111111111111111111111111111111111111hifc8npp', 'nano');
        });

        it('should match the expected NANO address type', function () {
            isValidAddressType('nano_1fnrrsrsifdpnkxrwwtfpjx5etcwt7a8hrz6fuqkh6w5i9jdsmo4yjg66iu7', 'NANO', 'prod', addressType.ADDRESS);
            isValidAddressType('xrb_1111111112111111111111111111111111111111111111111111hifc8npp', 'NANO', 'prod', undefined);
        });

        it('should return false for incorrect siacoin addresses', function () {
            commonTests('siacoin')
            invalid(
                'ffe1308c044ade30392a0cdc1fd5a4dbe94f9616a95faf888ed36123d9e711557aa497530372',
                'siacoin'
            )
        })

        it('should return false for incorrect lbry addresses', function () {
            commonTests('lbc')
            invalid('ffe1308c044ade30392a0cdc1fd5a4dbe94f9616a95faf888ed36123d9e711557aa497530372', 'lbc')
        });

        it('should return true for correct tron addresses', function () {
            valid('TNXoiAJ3dct8Fjg4M9fkLFh9S2v9TXc32G', 'trx')
        });

        it('should return false for incorrect tron addresses', function () {
            commonTests('trx');
            invalid('xrb_1111111112111111111111111111111111111111111111111111hifc8npp', 'trx');
            invalid('TNDzfERDpxLDS2w1q6yaFC7pzqaSQ3Bg31', 'trx');
        });

        it('should match the expected tron address type', function () {
            isValidAddressType('TNXoiAJ3dct8Fjg4M9fkLFh9S2v9TXc32G', 'tron', 'prod', addressType.ADDRESS);
            isValidAddressType('TNDzfERDpxLDS2w1q6yaFC7pzqaSQ3Bg31', 'tron', 'prod', undefined);
        });

        it('should return false for incorrect nem addresses', function () {
            commonTests('nem');
            invalid('xrb_1111111112111111111111111111111111111111111111111111hifc8npp', 'nem');
            invalid('TNDzfERDpxLDS2w1q6yaFC7pzqaSQ3Bg31', 'nem');

            invalid('3Myrq5QDgRq3nBVRSSv9UYRP36xTtpJND5y', 'nem', 'testnet');
            invalid('3My3KZgFQ3CrVHgz6vGRt8787sH4oAA1qp8', 'nem', 'testnet');
        });
        //15823701926930889868L
        it('should return false for incorrect lsk addresses', function () {
            commonTests('lsk');
            invalid('xrb_1111111112111111111111111111111111111111111111111111hifc8npp', 'lsk');
            invalid('TNDzfERDpxLDS2w1q6yaFC7pzqaSQ3Bg31', 'lsk');

            invalid('158237019269308898689L', 'lsk');
            invalid('158237A192B930C898689L', 'lsk');
        });

        it('should return false for incorrect bsv addresses', function () {
            commonTests('bsv');
            invalid('xrb_1111111112111111111111111111111111111111111111111111hifc8npp', 'bsv');
            invalid('TNDzfERDpxLDS2w1q6yaFC7pzqaSQ3Bg31', 'bsv');

            invalid('158237019269308898689L', 'bsv');
            invalid('158237A192B930C898689L', 'bsv');
            invalid('bitcoin:qzpuefrpg3kl2ykQe52rxn96pd3Kp4qudywr5pyrsf', 'bsv');
            invalid('pzuefrpg3kl2ykqe52rxn96pd3kp4qudywr5py', 'bsv');
            invalid('rlt2c2wuxr644encp3as0hygtj9djrsaumku3cex5', 'bsv');
            invalid('qra607y4wnkmnpy3wcmrxmltzkrxywcq85c7watpdx09', 'bsv');
        });

        it('should return false for incorrect stellar addresses', function () {
            commonTests('stellar');
            invalid('SBGWKM3CD4IL47QN6X54N6Y33T3JDNVI6AIJ6CD5IM47HG3IG4O36XCU', 'stellar');
            invalid('GBPXX0A5N4JYPESHAADMQKBPWZWQDQ64ZV6ZL2S3LAGW4SY7NTCMWIVL', 'stellar');
            invalid('GCFZB6L25D26RQFDWSSBDEYQ32JHLRMTT44ZYE3DZQUTYOL7WY43PLBG++', 'stellar');
            invalid('GADE5QJ2TY7S5ZB65Q43DFGWYWCPHIYDJ2326KZGAGBN7AE5UY6JVDRRA', 'stellar');
            invalid('GB6OWYST45X57HCJY5XWOHDEBULB6XUROWPIKW77L5DSNANBEQGUPADT2', 'stellar');
            invalid('GB6OWYST45X57HCJY5XWOHDEBULB6XUROWPIKW77L5DSNANBEQGUPADT2T', 'stellar');
            invalid('GDXIIZTKTLVYCBHURXL2UPMTYXOVNI7BRAEFQCP6EZCY4JLKY4VKFNLT', 'stellar');
            invalid('SAB5556L5AN5KSR5WF7UOEFDCIODEWEO7H2UR4S5R62DFTQOGLKOVZDY', 'stellar');
            invalid('gWRYUerEKuz53tstxEuR3NCkiQDcV4wzFHmvLnZmj7PUqxW2wt', 'stellar');
            invalid('g4VPBPrHZkfE8CsjuG2S4yBQNd455UWmk', 'stellar');
        });

        it('should return false for incorrect binance addresses', function () {
            commonTests('binance');
            commonTests('bnb');
            invalid('xrb_1f5e4w33ndqbkx4bw5jtp13kp5xghebfxcmw9hdt1f7goid1s4373w6tjdgu', 'bnb');
            invalid('nano_1f5e4w33ndqbkx4bw5jtp13kp5xghebfxcmw9hdt1f7goid1s4373w6tjdgu', 'bnb');
            invalid('xrb_1111111112111111111111111111111111111111111111111111hifc8npp', 'bnb');
            invalid('nano_111111111111111111111111111111111111111111111111111hifc8npp', 'bnb');
        });

        it('should return false for incorrect xtz(tezos) address', function () {
            commonTests('xtz');
            invalid('SBGWKM3CD4IL47QN6X54N6Y33T3JDNVI6AIJ6CD5IM47HG3IG4O36XCU', 'xtz');
            invalid('GBPXX0A5N4JYPESHAADMQKBPWZWQDQ64ZV6ZL2S3LAGW4SY7NTCMWIVL', 'xtz');
            invalid('GCFZB6L25D26RQFDWSSBDEYQ32JHLRMTT44ZYE3DZQUTYOL7WY43PLBG', 'xtz');
            invalid('tz1RR6wy9BeXG3Fjk25YmkSMGHxTtKkhpX', 'xtz');
            invalid('tz1h3rQ8wBxFd8L9B3d7JhaPQawu6Z568XU3xY', 'xtz');
            invalid('tz1Lhf4J9Qxoe4DZ2nfe8FGDnvVj7oKjnMY6', 'xtz');
            invalid('KT1E2LvxxFGB3Svh9p9HCP2jEEYyHjABMbK', 'xtz');

        });

        it('should return false for incorrect eos addresses', function () {
            commonTests('eos');
            invalid('1234567890123', 'eos');
            invalid('12345678901', 'eos');
            invalid('12345678901@', 'eos');
        });

        it('should return true for correct groestlcoin addresses', function () {
            valid('Foa6yZoKq2r4t3tUFKFcfoXSQjSodZsGx1', 'groestlcoin');
            valid('Fr2Z1bLzqRZByt2WeZwWnpCkA1eBYv83wZ', 'groestlcoin');
            valid('Fr2Z1bLzqRZByt2WeZwWnpCkA1eBYv83wZ', 'GRS');
            valid('Fr2Z1bLzqRZByt2WeZwWnpCkA1eBYv83wZ', 'Groestlcoin');
            valid('Fr2Z1bLzqRZByt2WeZwWnpCkA1eBYv83wZ', 'grs');
            valid('Fr2Z1bLzqRZByt2WeZwWnpCkA1eBYv83wZ', 'grs', 'prod');
            valid('Fr2Z1bLzqRZByt2WeZwWnpCkA1eBYv83wZ', 'grs', 'both');
            valid('FpM19fiGQNjNcaRjFaXVX6Nrewr4gnuuMZ', 'grs', 'prod');
            valid('3FyVFsEyyBPzHjD3qUEgX7Jsn4tcJWiqeN', 'grs', 'prod');
            valid('38mKdURe1zcQyrFqRLzR8PRao3iLFU5hwU', 'grs', 'prod');
            valid('mptPo5AvLzJXi4T82vR6g82fT5uJ9cgfsV', 'grs', 'both');
            valid('FdWcvgskHoXUTqeQRAiuGuh5KQ2EoXv5iM', 'groestlcoin');
            valid('mzBc4XEFSdzCDcTxAgf6EZXgsZWq3SbMQT', 'groestlcoin', 'testnet');
            valid('mzBc4XEFSdzCDcTxAgf6EZXgsZWq3SbMQT', 'groestlcoin', 'both');

            // p2sh addresses
            valid('3NJZLcZEEYBpxYEUGewU4knsQRn1T2Htk2', 'groestlcoin');
            valid('2MxKEf2su6FGAUfCEAHreGFQvEYrfZDahUf', 'groestlcoin', 'testnet');

            // segwit addresses
            valid('grs1q49qls5kklryt95g5xx4p6msycpgjp8ramfc9jq', 'grs');
            valid('grs1qnxt8adg4qk3ljl0qhvp4m0nt56w6ma77vwr2jq', 'grs');
            valid('tgrs1qw4z3xrtgx4f6w7akwpp2xa0gupmkv4yauemmm9', 'grs', 'testnet');

            invalid("grs1q49qls5kklryt95g5xq4p6msycpgjp8ramfc9jq", 'grs'),
            invalid("tgrs1qqjd3qhncsxdyh5gt7hz4k6zzvfguslwxwgv23j", 'grs')

        });
    });
});
