import { type AddressType, addressType } from '@trezor/network-module-suite-types';

import type { BitcoinNetworkSymbol } from '../supportedNetworks';
import { bitcoinValidator } from './bitcoinAddressValidator';

type BitcoinIsAddressValidCase = {
    address: string;
    symbol: BitcoinNetworkSymbol;
    expected: boolean;
};

type BitcoinAddressTypeCase = {
    address: string;
    symbol: BitcoinNetworkSymbol;
    expectedAddressType: AddressType | undefined;
};

const bitcoinIsAddressValidCases: BitcoinIsAddressValidCase[] = [
    {
        address: '12KYrjTdVGjFMtaxERSk3gphreJ5US8aUP',
        symbol: 'btc',
        expected: true,
    },
    {
        address: '12QeMLzSrB8XH8FvEzPMVoRxVAzTr5XM2y',
        symbol: 'btc',
        expected: true,
    },
    {
        address: '15uwigGExiNQxTNr1QSZYPXJMp9Px2YnVU',
        symbol: 'btc',
        expected: true,
    },
    {
        address: '3FyVFsEyyBPzHjD3qUEgX7Jsn4tcHNZFkn',
        symbol: 'btc',
        expected: true,
    },
    {
        address: '38mKdURe1zcQyrFqRLzR8PRao3iLGEPVsU',
        symbol: 'btc',
        expected: true,
    },
    {
        address: 'mptPo5AvLzJXi4T82vR6g82fT5uJ6HsQCu',
        symbol: 'test',
        expected: true,
    },
    {
        address: '1oNLrsHnBcR6dpaBpwz3LSwutbUNkNSjs',
        symbol: 'btc',
        expected: true,
    },
    {
        address: 'mzBc4XEFSdzCDcTxAgf6EZXgsZWpztRhef',
        symbol: 'test',
        expected: true,
    },
    {
        address: '1SQHtwR5oJRKLfiWQ2APsAd9miUc4k2ez',
        symbol: 'btc',
        expected: true,
    },
    {
        address: '116CGDLddrZhMrTwhCVJXtXQpxygTT1kHd',
        symbol: 'btc',
        expected: true,
    },
    {
        address: '3NJZLcZEEYBpxYEUGewU4knsQRn1WM5Fkt',
        symbol: 'btc',
        expected: true,
    },
    {
        address: '2MxKEf2su6FGAUfCEAHreGFQvEYrfYNHvL7',
        symbol: 'test',
        expected: true,
    },
    {
        address: 'GSa5espVLNseXEfKt46zEdS6jrPkmFghBU',
        symbol: 'test',
        expected: true,
    },
    {
        address: 'mvbu1Gdy8SUjTenqerxUaZyYjmveZvt33q',
        symbol: 'regtest',
        expected: true,
    },
    {
        address: 'ms1B699PA2tAfHTFTwN12Tzxa933WpmuHX',
        symbol: 'regtest',
        expected: true,
    },
    {
        address: '2N4Q5FhU2497BryFfUgbqkAJE87aKHUhXMp',
        symbol: 'regtest',
        expected: true,
    },
    {
        address: 'GSa5espVLNseXEfKt46zEdS6jrPkmFghBU',
        symbol: 'regtest',
        expected: true,
    },
    {
        address: 'bcrt1q8zx9dlztqz9apm7y5gtx8a0tlz57fhncycvun5',
        symbol: 'regtest',
        expected: true,
    },
    {
        address: 'bcrt1pzndg2aenknysnqs0d8gwhg54nqnc6yut2c6as76h4tyqhr8spr6slpjy3x',
        symbol: 'regtest',
        expected: true,
    },
    {
        address: 'BC1QW508D6QEJXTDG4Y5R3ZARVARY0C5XW7KV8F3T4',
        symbol: 'btc',
        expected: true,
    },
    {
        address: 'bc1qafk4yhqvj4wep57m62dgrmutldusqde8adh20d',
        symbol: 'btc',
        expected: true,
    },
    {
        address: 'bc1q6rgl33d3s9dugudw7n68yrryajkr3ha9q8q24j20zs62se4q9tsqdy0t2q',
        symbol: 'btc',
        expected: true,
    },
    {
        address: 'bc1pw508d6qejxtdg4y5r3zarvary0c5xw7kw508d6qejxtdg4y5r3zarvary0c5xw7k7grplx',
        symbol: 'btc',
        expected: false,
    },
    {
        address: 'BC1SW50QA3JX3S',
        symbol: 'btc',
        expected: false,
    },
    {
        address: 'bc1zw508d6qejxtdg4y5r3zarvaryvg6kdaj',
        symbol: 'btc',
        expected: false,
    },
    {
        address: 'bc1zw508d6qejxtdg4y5r3zarvaryvaxxpcs',
        symbol: 'btc',
        expected: false,
    },
    {
        address: 'bc1sw50qgdz25j',
        symbol: 'btc',
        expected: false,
    },
    {
        address: 'BC1SW50QGDZ25J',
        symbol: 'btc',
        expected: false,
    },
    {
        address: 'tb1qqqqqp399et2xygdj5xreqhjjvcmzhxw4aywxecjdzew6hylgvsesrxh6hy',
        symbol: 'test',
        expected: true,
    },
    {
        address: 'tb1qrp33g0q5c5txsp9arysrx4k6zdkfs4nce4xj0gdcccefvpysxf3q0sl5k7',
        symbol: 'test',
        expected: true,
    },
    {
        address: 'tb1qusxlgq9quu27ucxs7a2fg8nv0pycdzvxsjk9npyupupxw3y892ssaskm8v',
        symbol: 'test',
        expected: true,
    },
    {
        address: 'tb1pn2d0yjeedavnkd8z8lhm566p0f2utm3lgvxrsdehnl94y34txmts5s7t4c',
        symbol: 'test',
        expected: true,
    },
    {
        address: 'tb1qrp33g0q5c5txsp9arysrx4k6zdkfs4nce4xj0gdcccefvpysxf3q0sL5k7',
        symbol: 'test',
        expected: false,
    },
    {
        address: 'tc1qw508d6qejxtdg4y5r3zarvary0c5xw7kg3g4ty',
        symbol: 'btc',
        expected: false,
    },
    {
        address: 'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t5',
        symbol: 'btc',
        expected: false,
    },
    {
        address: 'BC13W508D6QEJXTDG4Y5R3ZARVARY0C5XW7KN40WF2',
        symbol: 'btc',
        expected: false,
    },
    {
        address: 'bc1rw5uspcuh',
        symbol: 'btc',
        expected: false,
    },
    {
        address: 'bc10w508d6qejxtdg4y5r3zarvary0c5xw7kw508d6qejxtdg4y5r3zarvary0c5xw7kw5rljs90',
        symbol: 'btc',
        expected: false,
    },
    {
        address: 'BC1QR508D6QEJXTDG4Y5R3ZARVARYV98GJ9P',
        symbol: 'btc',
        expected: false,
    },
    {
        address: 'bc1zw508d6qejxtdg4y5r3zarvaryvqyzf3du',
        symbol: 'btc',
        expected: false,
    },
    {
        address: '2MxKEf2su6FGAUfCEAHreGFQvEYrfYNHvL7',
        symbol: 'btc',
        expected: false,
    },
    {
        address: 'tb1qrp33g0q5c5txsp9arysrx4k6zdkfs4nce4xj0gdcccefvpysxf3q0sl5k7',
        symbol: 'btc',
        expected: false,
    },
    {
        address: 'tb1qrp33g0q5c5txsp9arysrx4k6zdkfs4nce4xj0gdcccefvpysxf3pjxtptv',
        symbol: 'test',
        expected: false,
    },
    {
        address: 'bc1gmk9yu',
        symbol: 'btc',
        expected: false,
    },
    {
        address: 'bitcoincash:qq4v32mtagxac29my6gwj6fd4tmqg8rysu23dax807',
        symbol: 'bch',
        expected: true,
    },
    {
        address: 'bitcoincash:qp3wjpa3tjlj042z2wv7hahsldgwhwy0rq9sywjpyy',
        symbol: 'bch',
        expected: true,
    },
    {
        address: 'qp3wjpa3tjlj042z2wv7hahsldgwhwy0rq9sywjpyy',
        symbol: 'bch',
        expected: true,
    },
    {
        address: 'LVg2kJoFNg45Nbpy53h7Fe1wKyeXVRhMH9',
        symbol: 'ltc',
        expected: true,
    },
    {
        address: 'LTpYZG19YmfvY2bBDYtCKpunVRw7nVgRHW',
        symbol: 'ltc',
        expected: true,
    },
    {
        address: 'Lb6wDP2kHGyWC7vrZuZAgV7V4ECyDdH7a6',
        symbol: 'ltc',
        expected: true,
    },
    {
        address: 'mzBc4XEFSdzCDcTxAgf6EZXgsZWpztRhef', // testnet
        symbol: 'ltc',
        expected: true,
    },
    {
        address: 'MUWheVyCBf3Fm3WNNXvotQ3Gj8NTSZCBVe',
        symbol: 'ltc',
        expected: true,
    },
    {
        address: '2MxKEf2su6FGAUfCEAHreGFQvEYrfYNHvL7', // testnet
        symbol: 'ltc',
        expected: true,
    },
    {
        address: 'QW2SvwjaJU8LD6GSmtm1PHnBG2xPuxwZFy', // testnet
        symbol: 'ltc',
        expected: true,
    },
    {
        address: 'QjpzxpbLp5pCGsCczMbfh1uhC3P89QZavY', // testnet
        symbol: 'ltc',
        expected: true,
    },
    {
        address: 'ltc1qajkrze8gc5qdx2ehldsmd596a2gprnn50a53mj3xxvy0zgtdq6gqumv03a',
        symbol: 'ltc',
        expected: true,
    },
    {
        address: 'ltc1q0lqwsyygg9frql6ujjfhevfculsxwledvv6yzc',
        symbol: 'ltc',
        expected: true,
    },
    {
        address: 'DPpJVPpvPNP6i6tMj4rTycAGh8wReTqaSU',
        symbol: 'doge',
        expected: true,
    },
    {
        address: 'DNzLUN6MyYVS5zf4Xc2yK69V3dXs6Mxia5',
        symbol: 'doge',
        expected: true,
    },
    {
        address: 'DPS6iZj7roHquvwRYXNBua9QtKPzigUUhM',
        symbol: 'doge',
        expected: true,
    },
    {
        address: 'A7JjzK9k9x5b2MkkQzqt91WZsuu7wTu6iS',
        symbol: 'doge',
        expected: true,
    },
    {
        address: '2MxKEf2su6FGAUfCEAHreGFQvEYrfYNHvL7', // testnet
        symbol: 'doge',
        expected: true,
    },
    {
        address: 't1U9yhDa5XEjgfnTgZoKddeSiEN1aoLkQxq',
        symbol: 'zec',
        expected: true,
    },
    {
        address: 't3Vz22vK5z2LcKEdg16Yv4FFneEL1zg9ojd',
        symbol: 'zec',
        expected: true,
    },
    {
        address: 't2UNzUUx8mWBCRYPRezvA363EYXyEpHokyi', // testnet
        symbol: 'zec',
        expected: true,
    },
    {
        address: '',
        symbol: 'btc',
        expected: false,
    },
    {
        address: '%%@',
        symbol: 'btc',
        expected: false,
    },
    {
        address: '1A1zP1ePQGefi2DMPTifTL5SLmv7DivfNa',
        symbol: 'btc',
        expected: false,
    },
    {
        address: 'bd839e4f6fadb293ba580df5dea7814399989983',
        symbol: 'btc',
        expected: false,
    },
    {
        address: '',
        symbol: 'test',
        expected: false,
    },
    {
        address: '%%@',
        symbol: 'test',
        expected: false,
    },
    {
        address: '1A1zP1ePQGefi2DMPTifTL5SLmv7DivfNa',
        symbol: 'test',
        expected: false,
    },
    {
        address: 'bd839e4f6fadb293ba580df5dea7814399989983',
        symbol: 'test',
        expected: false,
    },
    {
        address: 'mzBc4XEFSdzCDcTxAgf6EZXgsZWpztRhef',
        symbol: 'btc',
        expected: false,
    },
    {
        address: '12QeMLzSrB8XH8FvEzPMVoRxVAzTr5XM2y',
        symbol: 'test',
        expected: false,
    },
    {
        address: '3FyVFsEyyBPzHjD3qUEgX7Jsn4tcHNZFkn',
        symbol: 'test',
        expected: false,
    },
    {
        address: 'bc1zw508d6qejxtdg4y5r3zarvaryvg6kdaj',
        symbol: 'test',
        expected: false,
    },
    {
        address: 'BC1SW50QA3JX3S',
        symbol: 'test',
        expected: false,
    },
    {
        address: '',
        symbol: 'bch',
        expected: false,
    },
    {
        address: '%%@',
        symbol: 'bch',
        expected: false,
    },
    {
        address: '1A1zP1ePQGefi2DMPTifTL5SLmv7DivfNa',
        symbol: 'bch',
        expected: false,
    },
    {
        address: 'bd839e4f6fadb293ba580df5dea7814399989983',
        symbol: 'bch',
        expected: false,
    },
    {
        address: '12KYrjTdVGjFMtaxERSk3gphreJ5US8aUP',
        symbol: 'bch',
        expected: false,
    },
    {
        address: '12QeMLzSrB8XH8FvEzPMVoRxVAzTr5XM2y',
        symbol: 'bch',
        expected: false,
    },
    {
        address: '1oNLrsHnBcR6dpaBpwz3LSwutbUNkNSjs',
        symbol: 'bch',
        expected: false,
    },
    {
        address: 'mzBc4XEFSdzCDcTxAgf6EZXgsZWpztRhef',
        symbol: 'bch',
        expected: false,
    },
    {
        address: '3NJZLcZEEYBpxYEUGewU4knsQRn1WM5Fkt',
        symbol: 'bch',
        expected: false,
    },
    {
        address: '2MxKEf2su6FGAUfCEAHreGFQvEYrfYNHvL7',
        symbol: 'bch',
        expected: false,
    },
    {
        address: 'bitcoincash:qp3wjpa3tjlj042z2wv7hahsldgwhwy0rq9sywjpyya',
        symbol: 'bch',
        expected: false,
    },
    {
        address: 'qp3wjpa3tjlj042z2wv7hahsldgwhwy0rq9sywjpyya',
        symbol: 'bch',
        expected: false,
    },
    {
        address: 'bitcoincash:qq4v32mtagxac29my6gwj6fd4tmqg8rysu23dax808',
        symbol: 'bch',
        expected: false,
    },
    {
        address: 'bitcoincash:qq4v32mtagxac29my6gxx6fd4tmqg8rysu23dax807',
        symbol: 'bch',
        expected: false,
    },
    {
        address: 'bitcoincash:Qq4v32mtagxac29my6gwj6fd4tmqg8rysu23dax807',
        symbol: 'bch',
        expected: false,
    },
    {
        address: 'bitcoincash:QP3WJPA3tjlj042z2wv7hahsldgwhwy0rq9sywjpyy',
        symbol: 'bch',
        expected: false,
    },
    {
        address: 'bitcoincash:a5a8yrhz',
        symbol: 'bch',
        expected: false,
    },
    {
        address: 'a5a8yrhz',
        symbol: 'bch',
        expected: false,
    },
    {
        address: 'bitcoincash:q0n354ecu',
        symbol: 'bch',
        expected: false,
    },
    {
        address: 'bchtest:pr6m7j9njldwwzlg9v7v53unlr4jkmx6eyvwc0uz5t',
        symbol: 'bch',
        expected: false,
    },
    {
        address: 'bchtest:qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqdpn3jdgd',
        symbol: 'bch',
        expected: false,
    },
    {
        address: 'bchreg:qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqha9s37tt',
        symbol: 'bch',
        expected: false,
    },
    {
        address: '',
        symbol: 'ltc',
        expected: false,
    },
    {
        address: '%%@',
        symbol: 'ltc',
        expected: false,
    },
    {
        address: '1A1zP1ePQGefi2DMPTifTL5SLmv7DivfNa',
        symbol: 'ltc',
        expected: false,
    },
    {
        address: 'bd839e4f6fadb293ba580df5dea7814399989983',
        symbol: 'ltc',
        expected: false,
    },
    {
        address: '3NJZLcZEEYBpxYEUGewU4knsQRn1WM5Fkt',
        symbol: 'ltc',
        expected: false,
    },
    {
        address: 'vtc1qmzq3erafwvz23yabc9tu45uz2kx3d7esk0rayg',
        symbol: 'ltc',
        expected: false,
    },
    {
        address: 'ltc1qu7wq0evvgnmyyxcc7xhljavc7duu7js7jxhgjl0p390sy4udvtuq7361dl',
        symbol: 'ltc',
        expected: false,
    },
    {
        address: '',
        symbol: 'doge',
        expected: false,
    },
    {
        address: '%%@',
        symbol: 'doge',
        expected: false,
    },
    {
        address: '1A1zP1ePQGefi2DMPTifTL5SLmv7DivfNa',
        symbol: 'doge',
        expected: false,
    },
    {
        address: 'bd839e4f6fadb293ba580df5dea7814399989983',
        symbol: 'doge',
        expected: false,
    },
    {
        address: '',
        symbol: 'zec',
        expected: false,
    },
    {
        address: '%%@',
        symbol: 'zec',
        expected: false,
    },
    {
        address: '1A1zP1ePQGefi2DMPTifTL5SLmv7DivfNa',
        symbol: 'zec',
        expected: false,
    },
    {
        address: 'bd839e4f6fadb293ba580df5dea7814399989983',
        symbol: 'zec',
        expected: false,
    },
    {
        address: 't1Y9yhDa5XEjgfnTgZoKddeSiEN1aoLkQxq',
        symbol: 'zec',
        expected: false,
    },
    {
        address: 't3Yz22vK5z2LcKEdg16Yv4FFneEL1zg9ojd',
        symbol: 'zec',
        expected: false,
    },
    {
        address: 't2YNzUUx8mWBCRYPRezvA363EYXyEpHokyi',
        symbol: 'zec',
        expected: false,
    },
    {
        address: '1NSAR5mUUL3qZP29BfFj5jBPR5yWiiZZWi',
        symbol: 'btc',
        expected: true,
    },
    {
        address: '3CgkdgWwZ1RJGyHfcYnDe2qGTwaAtifeQw',
        symbol: 'btc',
        expected: true,
    },
    {
        address: 'bc1qwqdg6squsna38e46795at95yu9atm8azzmyvckulcc7kytlcckxswvvzej',
        symbol: 'btc',
        expected: true,
    },
    {
        address: 'bc1qr0c0jscha3tzr7963zz4u2wsezsxvpzkwmrvhg',
        symbol: 'btc',
        expected: true,
    },
    {
        address: 'bc1p5cyxnuxmeuwuvkwfem96lqzszd02n6xdcjrs20cac6yqjjwudpxqkedrcr',
        symbol: 'btc',
        expected: true,
    },
    {
        address: 'bc1pqyqszqgpqyqszqgpqyqszqgpqyqszqgpqyqszqgpqyqszqgpqyqsyjer9e',
        symbol: 'btc',
        expected: true,
    },
    {
        address: 'bc1sw50qgdz25j',
        symbol: 'test',
        expected: false,
    },
    {
        address: 'qwerty',
        symbol: 'btc',
        expected: false,
    },
    {
        address: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
        symbol: 'bch',
        expected: false,
    },
    {
        address: 'bc1pqyqszqgpqyqszqgpqyqszqgpqyqszqgpqyqszqgpqyqszqgpqyqsyjer9e',
        symbol: 'bch',
        expected: false,
    },
    {
        address: 'DMqRVLrhbam3Kcfddpxd6EYvEBbpi3bEpP',
        symbol: 'doge',
        expected: true,
    },
    {
        address: 'qwerty',
        symbol: 'doge',
        expected: false,
    },
];

const bitcoinAddressTypeCases: BitcoinAddressTypeCase[] = [
    {
        address: '1NSAR5mUUL3qZP29BfFj5jBPR5yWiiZZWi',
        symbol: 'btc',
        expectedAddressType: addressType.P2PKH,
    },
    {
        address: '3CgkdgWwZ1RJGyHfcYnDe2qGTwaAtifeQw',
        symbol: 'btc',
        expectedAddressType: addressType.P2SH,
    },
    {
        address: 'bc1qwqdg6squsna38e46795at95yu9atm8azzmyvckulcc7kytlcckxswvvzej',
        symbol: 'btc',
        expectedAddressType: addressType.P2WSH,
    },
    {
        address: 'bc1qr0c0jscha3tzr7963zz4u2wsezsxvpzkwmrvhg',
        symbol: 'btc',
        expectedAddressType: addressType.P2WPKH,
    },
    {
        address: 'bc1p5cyxnuxmeuwuvkwfem96lqzszd02n6xdcjrs20cac6yqjjwudpxqkedrcr',
        symbol: 'btc',
        expectedAddressType: addressType.P2TR,
    },
    {
        address: 'bc1pqyqszqgpqyqszqgpqyqszqgpqyqszqgpqyqszqgpqyqszqgpqyqsyjer9e',
        symbol: 'btc',
        expectedAddressType: addressType.P2TR,
    },
    {
        address: 'BC1SW50QA3JX3S',
        symbol: 'btc',
        expectedAddressType: addressType.WITNESS_UNKNOWN,
    },
    {
        address: 'bc1sw50qgdz25j',
        symbol: 'btc',
        expectedAddressType: addressType.WITNESS_UNKNOWN,
    },
    {
        address: 'bc1sw50qgdz25j',
        symbol: 'test',
        expectedAddressType: undefined,
    },
    {
        address: 'qwerty',
        symbol: 'btc',
        expectedAddressType: undefined,
    },
    {
        address: 'mvbu1Gdy8SUjTenqerxUaZyYjmveZvt33q',
        symbol: 'regtest',
        expectedAddressType: addressType.P2PKH,
    },
    {
        address: 'ms1B699PA2tAfHTFTwN12Tzxa933WpmuHX',
        symbol: 'regtest',
        expectedAddressType: addressType.P2PKH,
    },
    {
        address: '2N4Q5FhU2497BryFfUgbqkAJE87aKHUhXMp',
        symbol: 'regtest',
        expectedAddressType: addressType.P2SH,
    },
    {
        address: 'GSa5espVLNseXEfKt46zEdS6jrPkmFghBU',
        symbol: 'regtest',
        expectedAddressType: addressType.P2SH,
    },
    {
        address: 'bcrt1q8zx9dlztqz9apm7y5gtx8a0tlz57fhncycvun5',
        symbol: 'regtest',
        expectedAddressType: addressType.P2WPKH,
    },
    {
        address: 'bcrt1pzndg2aenknysnqs0d8gwhg54nqnc6yut2c6as76h4tyqhr8spr6slpjy3x',
        symbol: 'regtest',
        expectedAddressType: addressType.P2TR,
    },
    {
        address: 'bitcoincash:qq4v32mtagxac29my6gwj6fd4tmqg8rysu23dax807',
        symbol: 'bch',
        expectedAddressType: addressType.ADDRESS,
    },
    {
        address: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
        symbol: 'bch',
        expectedAddressType: undefined,
    },
    {
        address: 'qp3wjpa3tjlj042z2wv7hahsldgwhwy0rq9sywjpyy',
        symbol: 'bch',
        expectedAddressType: addressType.ADDRESS,
    },
    {
        address: 'bc1pqyqszqgpqyqszqgpqyqszqgpqyqszqgpqyqszqgpqyqszqgpqyqsyjer9e',
        symbol: 'bch',
        expectedAddressType: undefined,
    },
    {
        address: 'LVg2kJoFNg45Nbpy53h7Fe1wKyeXVRhMH9',
        symbol: 'ltc',
        expectedAddressType: addressType.P2PKH,
    },
    {
        address: 'ltc1qajkrze8gc5qdx2ehldsmd596a2gprnn50a53mj3xxvy0zgtdq6gqumv03a',
        symbol: 'ltc',
        expectedAddressType: addressType.P2WSH,
    },
    {
        address: 'ltc1q0lqwsyygg9frql6ujjfhevfculsxwledvv6yzc',
        symbol: 'ltc',
        expectedAddressType: addressType.P2WPKH,
    },
    {
        address: 'DMqRVLrhbam3Kcfddpxd6EYvEBbpi3bEpP',
        symbol: 'doge',
        expectedAddressType: addressType.P2PKH,
    },
    {
        address: 'A7JjzK9k9x5b2MkkQzqt91WZsuu7wTu6iS',
        symbol: 'doge',
        expectedAddressType: addressType.P2SH,
    },
    {
        address: 'qwerty',
        symbol: 'doge',
        expectedAddressType: undefined,
    },
];

describe('bitcoin validator', () => {
    it.each(bitcoinIsAddressValidCases)('validates $symbol address $address', testCase => {
        const { address, expected } = testCase;
        const { symbol } = testCase;

        expect(bitcoinValidator.isAddressValid(address, symbol)).toBe(expected);
    });

    it.each(bitcoinAddressTypeCases)('resolves address type for $address', testCase => {
        const { address, expectedAddressType } = testCase;
        const { symbol } = testCase;

        expect(bitcoinValidator.getAddressType(address, symbol)).toBe(expectedAddressType);
    });
});
