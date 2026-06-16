import * as WAValidator from '../index';
import type { NetworkSymbol } from '../networkTypes';
import { bitcoinValidator } from '../validators/bitcoin_validator';

const { addressType } = WAValidator;

function isValidAddressType(
    address: string,
    symbol: NetworkSymbol,
    expectedType: string | undefined,
) {
    const type = WAValidator.getAddressType(address, symbol);

    expect({ address, addressType: type }).toEqual({ address, addressType: expectedType });
}

function valid(address: string, symbol: NetworkSymbol) {
    const isValid = WAValidator.isAddressValid(address, symbol);

    expect({ address, symbol, valid: isValid }).toEqual({ address, symbol, valid: true });
}

function invalid(address: string, symbol: NetworkSymbol) {
    const isValid = WAValidator.isAddressValid(address, symbol);

    expect({ address, symbol, valid: isValid }).toEqual({ address, symbol, valid: false });
}

describe('WAValidator.isAddressValid()', function () {
    describe('valid results', function () {
        it('should return true for correct bitcoin addresses', function () {
            valid('12KYrjTdVGjFMtaxERSk3gphreJ5US8aUP', 'btc');
            valid('12QeMLzSrB8XH8FvEzPMVoRxVAzTr5XM2y', 'btc');
            valid('15uwigGExiNQxTNr1QSZYPXJMp9Px2YnVU', 'btc');
            valid('3FyVFsEyyBPzHjD3qUEgX7Jsn4tcHNZFkn', 'btc');
            valid('38mKdURe1zcQyrFqRLzR8PRao3iLGEPVsU', 'btc');
            valid('mptPo5AvLzJXi4T82vR6g82fT5uJ6HsQCu', 'test');
            valid('1oNLrsHnBcR6dpaBpwz3LSwutbUNkNSjs', 'btc');
            valid('mzBc4XEFSdzCDcTxAgf6EZXgsZWpztRhef', 'test');

            valid('1SQHtwR5oJRKLfiWQ2APsAd9miUc4k2ez', 'btc');
            valid('116CGDLddrZhMrTwhCVJXtXQpxygTT1kHd', 'btc');

            // p2sh addresses
            valid('3NJZLcZEEYBpxYEUGewU4knsQRn1WM5Fkt', 'btc');
            valid('2MxKEf2su6FGAUfCEAHreGFQvEYrfYNHvL7', 'test');

            // regtest
            valid('mvbu1Gdy8SUjTenqerxUaZyYjmveZvt33q', 'regtest');
            valid('ms1B699PA2tAfHTFTwN12Tzxa933WpmuHX', 'regtest');
            valid('2N4Q5FhU2497BryFfUgbqkAJE87aKHUhXMp', 'regtest');
            valid('GSa5espVLNseXEfKt46zEdS6jrPkmFghBU', 'regtest');

            valid('bcrt1q8zx9dlztqz9apm7y5gtx8a0tlz57fhncycvun5', 'regtest');
            valid('bcrt1pzndg2aenknysnqs0d8gwhg54nqnc6yut2c6as76h4tyqhr8spr6slpjy3x', 'regtest');

            // segwit addresses
            valid('BC1QW508D6QEJXTDG4Y5R3ZARVARY0C5XW7KV8F3T4', 'btc');
            invalid(
                'bc1pw508d6qejxtdg4y5r3zarvary0c5xw7kw508d6qejxtdg4y5r3zarvary0c5xw7k7grplx',
                'btc',
            ); // valid, but unspendable
            invalid('BC1SW50QA3JX3S', 'btc'); // valid, but unspendable
            invalid('bc1zw508d6qejxtdg4y5r3zarvaryvg6kdaj', 'btc'); // valid, but unspendable
            invalid('bc1sw50qgdz25j', 'btc'); // valid, but unspendable
            valid('tb1qqqqqp399et2xygdj5xreqhjjvcmzhxw4aywxecjdzew6hylgvsesrxh6hy', 'test');

            valid('tb1qrp33g0q5c5txsp9arysrx4k6zdkfs4nce4xj0gdcccefvpysxf3q0sl5k7', 'test'); // lowercase L
            invalid('tb1qrp33g0q5c5txsp9arysrx4k6zdkfs4nce4xj0gdcccefvpysxf3q0sL5k7', 'test'); // capital L

            invalid('tc1qw508d6qejxtdg4y5r3zarvary0c5xw7kg3g4ty', 'btc');
            invalid('bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t5', 'btc');
            invalid('BC13W508D6QEJXTDG4Y5R3ZARVARY0C5XW7KN40WF2', 'btc');
            invalid('bc1rw5uspcuh', 'btc');
            invalid(
                'bc10w508d6qejxtdg4y5r3zarvary0c5xw7kw508d6qejxtdg4y5r3zarvary0c5xw7kw5rljs90',
                'btc',
            );
            invalid('BC1QR508D6QEJXTDG4Y5R3ZARVARYV98GJ9P', 'btc');
            invalid('bc1zw508d6qejxtdg4y5r3zarvaryvqyzf3du', 'btc');
            invalid('tb1qrp33g0q5c5txsp9arysrx4k6zdkfs4nce4xj0gdcccefvpysxf3pjxtptv', 'test');
            invalid('bc1gmk9yu', 'btc');
        });

        it('should match the expected bitcoin address type', function () {
            isValidAddressType('1NSAR5mUUL3qZP29BfFj5jBPR5yWiiZZWi', 'btc', addressType.P2PKH);
            isValidAddressType('3CgkdgWwZ1RJGyHfcYnDe2qGTwaAtifeQw', 'btc', addressType.P2SH);
            isValidAddressType(
                'bc1qwqdg6squsna38e46795at95yu9atm8azzmyvckulcc7kytlcckxswvvzej',
                'btc',
                addressType.P2WSH,
            );
            isValidAddressType(
                'bc1qr0c0jscha3tzr7963zz4u2wsezsxvpzkwmrvhg',
                'btc',
                addressType.P2WPKH,
            );
            isValidAddressType(
                'bc1p5cyxnuxmeuwuvkwfem96lqzszd02n6xdcjrs20cac6yqjjwudpxqkedrcr',
                'btc',
                addressType.P2TR,
            );
            isValidAddressType(
                'bc1pqyqszqgpqyqszqgpqyqszqgpqyqszqgpqyqszqgpqyqszqgpqyqsyjer9e',
                'btc',
                addressType.P2TR,
            );
            isValidAddressType('BC1SW50QA3JX3S', 'btc', addressType.WITNESS_UNKNOWN); // bech32
            isValidAddressType('bc1sw50qgdz25j', 'btc', addressType.WITNESS_UNKNOWN); // bech32m ?
            isValidAddressType('bc1sw50qgdz25j', 'test', undefined);
            isValidAddressType('qwerty', 'btc', undefined);
            isValidAddressType('mvbu1Gdy8SUjTenqerxUaZyYjmveZvt33q', 'regtest', addressType.P2PKH);
            isValidAddressType('ms1B699PA2tAfHTFTwN12Tzxa933WpmuHX', 'regtest', addressType.P2PKH);
            isValidAddressType('2N4Q5FhU2497BryFfUgbqkAJE87aKHUhXMp', 'regtest', addressType.P2SH);
            isValidAddressType('GSa5espVLNseXEfKt46zEdS6jrPkmFghBU', 'regtest', addressType.P2SH);
            isValidAddressType(
                'bcrt1q8zx9dlztqz9apm7y5gtx8a0tlz57fhncycvun5',
                'regtest',
                addressType.P2WPKH,
            );
            isValidAddressType(
                'bcrt1pzndg2aenknysnqs0d8gwhg54nqnc6yut2c6as76h4tyqhr8spr6slpjy3x',
                'regtest',
                addressType.P2TR,
            );
        });

        it('should return true for correct bitcoincash addresses', function () {
            valid('bitcoincash:qq4v32mtagxac29my6gwj6fd4tmqg8rysu23dax807', 'bch');
            valid('bitcoincash:qp3wjpa3tjlj042z2wv7hahsldgwhwy0rq9sywjpyy', 'bch');
            valid('qp3wjpa3tjlj042z2wv7hahsldgwhwy0rq9sywjpyy', 'bch');
        });

        it('should match the expected BCH address type', function () {
            isValidAddressType(
                'bitcoincash:qq4v32mtagxac29my6gwj6fd4tmqg8rysu23dax807',
                'bch',
                addressType.ADDRESS,
            );
            isValidAddressType('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', 'bch', undefined);
            isValidAddressType(
                'qp3wjpa3tjlj042z2wv7hahsldgwhwy0rq9sywjpyy',
                'bch',
                addressType.ADDRESS,
            );
            isValidAddressType(
                'bc1pqyqszqgpqyqszqgpqyqszqgpqyqszqgpqyqszqgpqyqszqgpqyqsyjer9e',
                'bch',
                undefined,
            ); // BTC address
        });

        it('should return true for correct litecoin addresses', function () {
            valid('LVg2kJoFNg45Nbpy53h7Fe1wKyeXVRhMH9', 'ltc');
            valid('LTpYZG19YmfvY2bBDYtCKpunVRw7nVgRHW', 'ltc');
            valid('Lb6wDP2kHGyWC7vrZuZAgV7V4ECyDdH7a6', 'ltc');
            valid('mzBc4XEFSdzCDcTxAgf6EZXgsZWpztRhef', 'ltc'); // testnet

            // p2sh addresses
            valid('MUWheVyCBf3Fm3WNNXvotQ3Gj8NTSZCBVe', 'ltc');

            valid('2MxKEf2su6FGAUfCEAHreGFQvEYrfYNHvL7', 'ltc'); // testnet
            valid('QW2SvwjaJU8LD6GSmtm1PHnBG2xPuxwZFy', 'ltc'); // testnet
            valid('QjpzxpbLp5pCGsCczMbfh1uhC3P89QZavY', 'ltc'); // testnet

            // segwit
            valid('ltc1qajkrze8gc5qdx2ehldsmd596a2gprnn50a53mj3xxvy0zgtdq6gqumv03a', 'ltc');
        });

        it('should match the expected litecoin address type', function () {
            isValidAddressType('LVg2kJoFNg45Nbpy53h7Fe1wKyeXVRhMH9', 'ltc', addressType.P2PKH);
            isValidAddressType(
                'ltc1qajkrze8gc5qdx2ehldsmd596a2gprnn50a53mj3xxvy0zgtdq6gqumv03a',
                'ltc',
                addressType.P2WSH,
            );
        });

        it('should return true for correct dogecoin addresses', function () {
            valid('DPpJVPpvPNP6i6tMj4rTycAGh8wReTqaSU', 'doge');
            valid('DNzLUN6MyYVS5zf4Xc2yK69V3dXs6Mxia5', 'doge');
            valid('DPS6iZj7roHquvwRYXNBua9QtKPzigUUhM', 'doge');
            //TODO: NEED A DOGECOIN TESTNET ADDRESS

            //p2sh addresses
            valid('A7JjzK9k9x5b2MkkQzqt91WZsuu7wTu6iS', 'doge');
            valid('2MxKEf2su6FGAUfCEAHreGFQvEYrfYNHvL7', 'doge'); // testnet
        });

        it('should match the expected dogecoin address type', function () {
            isValidAddressType('DMqRVLrhbam3Kcfddpxd6EYvEBbpi3bEpP', 'doge', addressType.P2PKH);
            isValidAddressType('A7JjzK9k9x5b2MkkQzqt91WZsuu7wTu6iS', 'doge', addressType.P2SH);
            isValidAddressType('qwerty', 'doge', undefined);
        });

        it('should return true for correct Ethereum addresses', function () {
            valid('0xE37c0D48d68da5c5b14E5c1a9f1CFE802776D9FF', 'eth');
            valid('0xa00354276d2fC74ee91e37D085d35748613f4748', 'eth');
            valid('0xAff4d6793F584a473348EbA058deb8caad77a288', 'eth');
            valid('0xc6d9d2cd449a754c494264e1809c50e34d64562b', 'eth');
            valid('0x52908400098527886E0F7030069857D2E4169EE7', 'eth');
            valid('0x8617E340B3D01FA5F11F306F4090FD50E238070D', 'eth');
            valid('0xde709f2102306220921060314715629080e2fb77', 'eth');
            valid('0x27b1fdb04752bbc536007a920d24acb045561c26', 'eth');
            valid('0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed', 'eth');
            valid('0xfB6916095ca1df60bB79Ce92cE3Ea74c37c5d359', 'eth');
            valid('0xdbF03B407c01E7cD3CBea99509d93f8DDDC8C6FB', 'eth');
            valid('0xD1220A0cf47c7B9Be7A2E6BA89F429762e7b9aDb', 'eth');

            valid('0xD1220A0cf47c7B9Be7A2E6BA89F429762e7b9aDb', 'etc');
        });

        it('should match the expected eip55 address type', function () {
            isValidAddressType(
                '0xE37c0D48d68da5c5b14E5c1a9f1CFE802776D9FF',
                'eth',
                addressType.ADDRESS,
            );
            isValidAddressType(
                '0xD1220A0cf47c7B9Be7A2E6BA89F429762e7b9aDb',
                'etc',
                addressType.ADDRESS,
            );
        });

        it('should return true for correct Ripple addresses', function () {
            valid('rG1QQv2nh2gr7RCZ1P8YYcBUKCCN633jCn', 'xrp');
            valid('r3kmLJN5D28dHuH8vZNUZpMC43pEHpaocV', 'xrp');
            valid('rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh', 'xrp');
            valid('rDTXLQ7ZKZVKz33zJbHjgVShjsBnqMBhmN', 'xrp');
        });

        it('should match the expected Ripple address type', function () {
            isValidAddressType('rG1QQv2nh2gr7RCZ1P8YYcBUKCCN633jCn', 'xrp', addressType.ADDRESS);
            isValidAddressType('rG1QQv2nh2gr7RCZ1P8YYcBUKCCN633jCN', 'xrp', undefined);
        });

        it('should return true for correct zcash addresses', function () {
            valid('t1U9yhDa5XEjgfnTgZoKddeSiEN1aoLkQxq', 'zec');
            valid('t3Vz22vK5z2LcKEdg16Yv4FFneEL1zg9ojd', 'zec');
            valid('t2UNzUUx8mWBCRYPRezvA363EYXyEpHokyi', 'zec'); // testnet
        });

        it('should return true for correct Cardano addresses', function () {
            valid('Ae2tdPwUPEYxYNJw1He1esdZYvjmr4NtPzUsGTiqL9zd8ohjZYQcwu6kom7', 'ada');
            valid(
                'DdzFFzCqrhsfdzUZxvuBkhV8Lpm9p43p9ubh79GCTkxJikAjKh51qhtCFMqUniC5tv5ZExyvSmAte2Du2tGimavSo6qSgXbjiy8qZRTg',
                'ada',
            );
            valid('Ae2tdPwUPEZKmwoy3AU3cXb5Chnasj6mvVNxV1H11997q3VW5ihbSfQwGpm', 'ada');
            valid(
                '4swhHtxKapQbj3TZEipgtp7NQzcRWDYqCxXYoPQWjGyHmhxS1w1TjUEszCQT1sQucGwmPQMYdv1FYs3d51KgoubviPBf',
                'ada',
            );
            valid(
                'addr1qxnv5u3vrx2t37h3u27qd5ukgcjmrl4f8mu9f5sza3h20cxsfjh80un9kvlggfcdw8fp5kqp9tztqnee9msd0qsafhdsyqclvk',
                'ada',
            );
            valid(
                'ADDR1QXNV5U3VRX2T37H3U27QD5UKGCJMRL4F8MU9F5SZA3H20CXSFJH80UN9KVLGGFCDW8FP5KQP9TZTQNEE9MSD0QSAFHDSYQCLVK',
                'ada',
            );
            valid(
                'addr1qxclz0u9guazk70l9vv3xf67wx3psx3dekasvy43xfvz56qcs6f7ssw2x0fcesudyj8h224rnzkae2lqlnw8f3353t3sjggfx0',
                'ada',
            );
            valid(
                'addr_test1qru5ktsj5zsmhvwv0ep9zuhfu39x3wyt9wxjnsn3cagsyy59ckxhkvuc5xj49rw6zrp443wlygmhv8gwcu38jk6ms6usqd9a9q',
                'ada',
            );
        });

        it('should return true for a correct Cardano stake address when network type is stake', function () {
            valid('stake1uya87zwnmax0v6nnn8ptqkl6ydx4522kpsc3l3wmf3yswygwx45el', 'ada');
        });

        it('should match the expected Cardano address type - mainnet', function () {
            isValidAddressType(
                'Ae2tdPwUPEYxYNJw1He1esdZYvjmr4NtPzUsGTiqL9zd8ohjZYQcwu6kom7',
                'ada',
                addressType.ADDRESS,
            );
        });

        it('should match the expected Cardano address type - testnet', function () {
            isValidAddressType(
                'addr_test1qru5ktsj5zsmhvwv0ep9zuhfu39x3wyt9wxjnsn3cagsyy59ckxhkvuc5xj49rw6zrp443wlygmhv8gwcu38jk6ms6usqd9a9q',
                'ada',
                addressType.ADDRESS,
            );
        });

        it('should return true for correct BSC addresses', function () {
            valid('0x0590396689ee1d287147e9383fb8dd24532f2006', 'bsc');
            valid('0x07fc5c2bcaa0fa6bdaa4fff897490312c8f33c27', 'bsc');
        });

        it('should return true for correct trx addresses', function () {
            valid('TNDzfERDpxLDS2w1q6yaFC7pzqaSQ3Bg3r', 'trx');
        });

        it('should return true for correct stellar addresses', function () {
            valid('GBBM6BKZPEHWYO3E3YKREDPQXMS4VK35YLNU7NFBRI26RAN7GI5POFBB', 'xlm');
            valid('GB7KKHHVYLDIZEKYJPAJUOTBE5E3NJAXPSDZK7O6O44WR3EBRO5HRPVT', 'xlm');
            valid('GD6WVYRVID442Y4JVWFWKWCZKB45UGHJAABBJRS22TUSTWGJYXIUR7N2', 'xlm');
            valid('GBCG42WTVWPO4Q6OZCYI3D6ZSTFSJIXIS6INCIUF23L6VN3ADE4337AP', 'xlm');
            valid('GDFX463YPLCO2EY7NGFMI7SXWWDQAMASGYZXCG2LATOF3PP5NQIUKBPT', 'xlm');
            valid('GBXEODUMM3SJ3QSX2VYUWFU3NRP7BQRC2ERWS7E2LZXDJXL2N66ZQ5PT', 'xlm');
            valid('GAJHORKJKDDEPYCD6URDFODV7CVLJ5AAOJKR6PG2VQOLWFQOF3X7XLOG', 'xlm');
            valid('GACXQEAXYBEZLBMQ2XETOBRO4P66FZAJENDHOQRYPUIXZIIXLKMZEXBJ', 'xlm');
            valid('GDD3XRXU3G4DXHVRUDH7LJM4CD4PDZTVP4QHOO4Q6DELKXUATR657OZV', 'xlm');
            valid('GDTYVCTAUQVPKEDZIBWEJGKBQHB4UGGXI2SXXUEW7LXMD4B7MK37CWLJ', 'xlm');
            valid('GDC5UWE3G6Z4KYOTET5NOCRIVBKWH7MOCSPZPHF4GHQ6XUDD27ACOACD', 'xlm');
        });

        it('should match the expected stellar address type', function () {
            isValidAddressType(
                'GBBM6BKZPEHWYO3E3YKREDPQXMS4VK35YLNU7NFBRI26RAN7GI5POFBB',
                'xlm',
                addressType.ADDRESS,
            );
            isValidAddressType(
                'SBGWKM3CD4IL47QN6X54N6Y33T3JDNVI6AIJ6CD5IM47HG3IG4O36XCU',
                'xlm',
                undefined,
            );
        });

        it('should return true for correct BNB smart chain address', function () {
            valid('0x7ae2f5b9e386cd1b50a4550696d957cb4900f03a', 'bsc');
            valid('0x0000000000000000000000000000000000001000', 'bsc');
        });

        it('should return false for incorrect BNB smart chain address', function () {
            invalid('bnb1xlvns0n2mxh77mzaspn2hgav4rr4m8eerfju38', 'bsc');
        });
    });

    describe('invalid results', function () {
        function commonTests(symbol: NetworkSymbol) {
            invalid('', symbol); //reject blank
            invalid('%%@', symbol); //reject invalid base58 string
            invalid('1A1zP1ePQGefi2DMPTifTL5SLmv7DivfNa', symbol); //reject invalid address
            invalid('bd839e4f6fadb293ba580df5dea7814399989983', symbol); //reject transaction id's
        }

        it('should return false for incorrect bitcoin addresses', function () {
            commonTests('btc');

            // testnet in prod and prod in testnet
            invalid('mzBc4XEFSdzCDcTxAgf6EZXgsZWpztRhef', 'btc');
            invalid('12QeMLzSrB8XH8FvEzPMVoRxVAzTr5XM2y', 'test');
        });

        it('should return false for incorrect bitcoincash addresses', function () {
            commonTests('bch');
            invalid('12KYrjTdVGjFMtaxERSk3gphreJ5US8aUP', 'bch');
            invalid('12QeMLzSrB8XH8FvEzPMVoRxVAzTr5XM2y', 'bch');
            invalid('1oNLrsHnBcR6dpaBpwz3LSwutbUNkNSjs', 'bch');
            invalid('mzBc4XEFSdzCDcTxAgf6EZXgsZWpztRhef', 'bch');
            // p2sh addresses
            invalid('3NJZLcZEEYBpxYEUGewU4knsQRn1WM5Fkt', 'bch');
            invalid('2MxKEf2su6FGAUfCEAHreGFQvEYrfYNHvL7', 'bch');
            // bitcoincash
            invalid('bitcoincash:qp3wjpa3tjlj042z2wv7hahsldgwhwy0rq9sywjpyya', 'bch');
            invalid('qp3wjpa3tjlj042z2wv7hahsldgwhwy0rq9sywjpyya', 'bch');
        });

        it('should return false for bitcoincash addresses with corrupted checksums', function () {
            // Tampered last char of a known-valid address
            invalid('bitcoincash:qq4v32mtagxac29my6gwj6fd4tmqg8rysu23dax808', 'bch');
            // Tampered middle of a known-valid address
            invalid('bitcoincash:qq4v32mtagxac29my6gxx6fd4tmqg8rysu23dax807', 'bch');
        });

        it('should return false for mixed-case bitcoincash addresses', function () {
            invalid('bitcoincash:Qq4v32mtagxac29my6gwj6fd4tmqg8rysu23dax807', 'bch');
            invalid('bitcoincash:QP3WJPA3tjlj042z2wv7hahsldgwhwy0rq9sywjpyy', 'bch');
        });

        it('should return false for structurally invalid bitcoincash addresses with valid checksums', function () {
            invalid('bitcoincash:a5a8yrhz', 'bch');
            invalid('a5a8yrhz', 'bch');
            invalid('bitcoincash:q0n354ecu', 'bch');
        });

        it('should return false for non-mainnet bitcoincash addresses', function () {
            // 'bchtest' (testnet) and 'bchreg' (regtest) prefixes per cashaddr spec:
            // https://github.com/bitcoincashorg/bitcoincash.org/blob/master/spec/cashaddr.md#prefix
            invalid('bchtest:pr6m7j9njldwwzlg9v7v53unlr4jkmx6eyvwc0uz5t', 'bch');
            invalid('bchtest:qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqdpn3jdgd', 'bch');
            invalid('bchreg:qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqha9s37tt', 'bch');
        });

        it('should return false for incorrect litecoin addresses', function () {
            commonTests('ltc');
            // do not allow old ltc addresses
            invalid('3NJZLcZEEYBpxYEUGewU4knsQRn1WM5Fkt', 'ltc');
            invalid('vtc1qmzq3erafwvz23yabc9tu45uz2kx3d7esk0rayg', 'ltc');
            invalid('ltc1qu7wq0evvgnmyyxcc7xhljavc7duu7js7jxhgjl0p390sy4udvtuq7361dl', 'ltc');
        });

        it('should return false for incorrect dogecoin addresses', function () {
            commonTests('doge');
        });

        it('should return false for incorrect eip55 addresses', function () {
            invalid('6xAff4d6793F584a473348EbA058deb8caad77a288', 'eth');
            invalid('0x02fcd51aAbB814FfFe17908fbc888A8975D839A5', 'eth');
            invalid('0XD1220A0CF47C7B9BE7A2E6BA89F429762E7B9ADB', 'eth');
            invalid('aFf4d6793f584a473348ebA058deb8caad77a2885', 'eth');
            invalid('0xff4d6793F584a473', 'eth');

            invalid('0x02fcd51aAbB814FfFe17908fbc888A8975D839A5', 'etc');
        });

        it('should return false for incorrect ripple addresses', function () {
            invalid('rG1QQv2nh2gr7RCZ1P8YYcBUKCCN633jCN', 'xrp');
            invalid('rDTXLQ7ZKZVKz33zJbHjgVShjsBnqMBhMN', 'xrp');
            invalid('6xAff4d6793F584a473348EbA058deb8ca', 'xrp');
            invalid('DJ53hTyLBdZp2wMi5BsCS3rtEL1ioYUkva', 'xrp');
        });

        it('should return false for incorrect zcash addresses', function () {
            commonTests('zec');
            invalid('t1Y9yhDa5XEjgfnTgZoKddeSiEN1aoLkQxq', 'zec');
            invalid('t3Yz22vK5z2LcKEdg16Yv4FFneEL1zg9ojd', 'zec');
            invalid('t2YNzUUx8mWBCRYPRezvA363EYXyEpHokyi', 'zec');
        });

        it('should return false for incorrect cardano addresses', function () {
            commonTests('ada');
            invalid('Ae2tdPwUPEYxYNJw1He1esdZYvjmr4NtPzUsGTiqL9zd8ohjZYQcwu6lom7', 'ada');
            invalid(
                'DdzFFzCqrhsfdzUZxvuBkhV8Lpm9p43p9ubh79GCTkxJikAjKh51qhtCFMqUniC5tv5ZExyvSmAte2Du2tGimavSo6qSgXbjiy8qZRTg1',
                'ada',
            );
            invalid(
                'DdzFFzCqrhsfdzUZxvuBkhV8Lpm9p43p9ubh79GCTkxJikAjKh51qhtCFMqUniC5tv5ZExyvSmAte2Du2tGimavSo6qSgXbjiy8qZRT',
                'ada',
            );
            invalid(
                'ADDR1qXNV5U3VRX2T37H3U27QD5UKGCJMRL4F8MU9F5SZA3H20CXSFJH80UN9KVLGGFCDW8FP5KQP9TZTQNEE9MSD0QSAFHDSYQCLVK',
                'ada',
            );
            invalid(
                'addr1qxnv5u3vrx2t37h3u27qd5ukgcjmrl4f8mu9f5sza3h20cxsfjh80un9kvlggfcdw8fp5kqp9tztqnee9msd0qsafhdsyqclvl',
                'ada',
            );
        });

        it('should return false for a Cardano address that decodes to a CBOR non-array primitive', function () {
            invalid('2', 'ada');
        });

        it('should return false for a Cardano address whose CBOR-decoded second element is not a number', function () {
            invalid('kkVd', 'ada');
        });

        it('should return false for a Cardano address whose CBOR-decoded array has an unexpected length', function () {
            invalid('5yWKF5vph3', 'ada');
        });

        it('should return false for a Cardano address whose CBOR-decoded tag is missing a value', function () {
            invalid('kzKq', 'ada');
        });

        it('should return undefined as the Cardano address type for a string that fails both legacy and bech32 decoding', function () {
            isValidAddressType('notacardanoaddress', 'ada', undefined);
        });

        it('should return true for correct tron addresses', function () {
            valid('TNXoiAJ3dct8Fjg4M9fkLFh9S2v9TXc32G', 'trx');
        });

        it('should return false for incorrect tron addresses', function () {
            commonTests('trx');
            invalid('xrb_1111111112111111111111111111111111111111111111111111hifc8npp', 'trx');
            invalid('TNDzfERDpxLDS2w1q6yaFC7pzqaSQ3Bg31', 'trx');
        });

        it('should match the expected tron address type', function () {
            isValidAddressType('TNXoiAJ3dct8Fjg4M9fkLFh9S2v9TXc32G', 'trx', addressType.ADDRESS);
            isValidAddressType('TNDzfERDpxLDS2w1q6yaFC7pzqaSQ3Bg31', 'trx', undefined);
        });

        it('should return false for incorrect stellar addresses', function () {
            commonTests('xlm');
            invalid('SBGWKM3CD4IL47QN6X54N6Y33T3JDNVI6AIJ6CD5IM47HG3IG4O36XCU', 'xlm');
            invalid('GBPXX0A5N4JYPESHAADMQKBPWZWQDQ64ZV6ZL2S3LAGW4SY7NTCMWIVL', 'xlm');
            invalid('GCFZB6L25D26RQFDWSSBDEYQ32JHLRMTT44ZYE3DZQUTYOL7WY43PLBG++', 'xlm');
            invalid('GADE5QJ2TY7S5ZB65Q43DFGWYWCPHIYDJ2326KZGAGBN7AE5UY6JVDRRA', 'xlm');
            invalid('GB6OWYST45X57HCJY5XWOHDEBULB6XUROWPIKW77L5DSNANBEQGUPADT2', 'xlm');
            invalid('GB6OWYST45X57HCJY5XWOHDEBULB6XUROWPIKW77L5DSNANBEQGUPADT2T', 'xlm');
            invalid('GDXIIZTKTLVYCBHURXL2UPMTYXOVNI7BRAEFQCP6EZCY4JLKY4VKFNLT', 'xlm');
            invalid('SAB5556L5AN5KSR5WF7UOEFDCIODEWEO7H2UR4S5R62DFTQOGLKOVZDY', 'xlm');
            invalid('gWRYUerEKuz53tstxEuR3NCkiQDcV4wzFHmvLnZmj7PUqxW2wt', 'xlm');
            invalid('g4VPBPrHZkfE8CsjuG2S4yBQNd455UWmk', 'xlm');
        });

        it('should return false for incorrect bsc addresses', function () {
            commonTests('bsc');
            invalid('xrb_1f5e4w33ndqbkx4bw5jtp13kp5xghebfxcmw9hdt1f7goid1s4373w6tjdgu', 'bsc');
            invalid('nano_1f5e4w33ndqbkx4bw5jtp13kp5xghebfxcmw9hdt1f7goid1s4373w6tjdgu', 'bsc');
            invalid('xrb_1111111112111111111111111111111111111111111111111111hifc8npp', 'bsc');
            invalid('nano_111111111111111111111111111111111111111111111111111hifc8npp', 'bsc');
        });

        it('should return true for correct solana addresses', function () {
            valid('64duFXLEMcVaZpm4SRmtqEdSQ5LFht22hK1SLu2ayU9b', 'sol');
            valid('DkMYphwx9Z9AdR5Y8M4md1H96TKxfyoAHxUYH56F4ij5', 'sol');
            valid('CN2JT7qJ84aVUMtSGuNSte5ytP5eMeeHgTVzyBiHDxMr', 'sol');
            valid('H22WwH3qSAbZ6fH1n9PzGso3vBwQUz7gmK827ijLTgJW', 'sol');
        });

        it('should return false for incorrect solana addresses', function () {
            invalid('sol_123456', 'sol');
            invalid('65udFxlkjm1xfyo', 'sol');
            invalid(
                'CN2JT7qJ84aVUMtSGuNSte5ytP5eMeeHgTVzyBiHDxMrH22WwH3qSAbZ6fH1n9PzGso3vBwQUz7gmK827ijLTgJW',
                'sol',
            );
        });
    });
});

describe('bitcoinValidator', function () {
    it('throws when called with unsupported network symbol', function () {
        expect(() =>
            bitcoinValidator.isAddressValid('12KYrjTdVGjFMtaxERSk3gphreJ5US8aUP', 'eth'),
        ).toThrow('Unsupported bitcoin network symbol: eth');
    });
});
