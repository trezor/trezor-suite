import { networks } from '@trezor/utxo-lib';

import {
    getBlockAddressScript,
    getBlockFilter,
    getBlockMultiFilter,
    getMempoolAddressScript,
    getMempoolFilter,
} from '../../src/backend/filters';

const NETWORK = networks.regtest;

const COINJOIN_RECEIVE_0 = 'bcrt1pksw3pwfgueqmnxvyesjxj24q2wek77lsq4jan745j2z9wr9csf3qpgmdpz'; // OUT 106, IN 108
const COINJOIN_CHANGE_0 = 'bcrt1pc3488glntqgqel3jjtwujl8g50xrvx04ewpt799ns77dg756km5qa66ca8'; // OUT 108, IN 109
const BECH32_RECEIVE_0 = 'bcrt1qkvwu9g3k2pdxewfqr7syz89r3gj557l374sg5v'; // OUT 157, IN 158
const BECH32_CHANGE_0 = 'bcrt1qejqxwzfld7zr6mf7ygqy5s5se5xq7vmt8ntmj0'; // OUT 159, IN 160
const TAPROOT_RECEIVE_0 = 'bcrt1pswrqtykue8r89t9u4rprjs0gt4qzkdfuursfnvqaa3f2yql07zmq2fdmpx'; // OUT 161, IN 162
const TAPROOT_CHANGE_0 = 'bcrt1pn2d0yjeedavnkd8z8lhm566p0f2utm3lgvxrsdehnl94y34txmtsef5dqz'; // OUT 162, IN 163

const BLOCK_106 = {
    height: 106,
    filter: '0135dff8',
    hash: '2c94e940c0584944bfdf0137936e6a6fc8ad4416a96b3663b09961574568331c',
};

const BLOCK_108 = {
    height: 108,
    filter: '0662a3ec50c3e5524c8b25ceaa9c061aef80',
    hash: '4bf55f6337c2e921fe2bf87bb121ded31988ea99d9edf2dc5498f605fd1d966e',
};

const BLOCK_109 = {
    height: 109,
    filter: '0704ac18e1c3e5f4f22fd21e20233627d8927624',
    hash: '35fbbceea020bc388dcb1b7afcba60e27da0889bd3d0689d2a786e9a8bd12746',
};

const BLOCK_157 = {
    height: 157,
    filter: '01656c90',
    hash: '09f69854a4572575e2a8af0dea70ff5efd46957e2cb60e81c0d760098ab48b44',
};

const BLOCK_158 = {
    height: 158,
    filter: '0298ad7857d0c0',
    hash: '5513d63651bbb32985b54fa9e0e530553e3e9cebdd10feae7f019c04edb80f61',
};

const BLOCK_159 = {
    height: 159,
    filter: '03a69058941e6f5fc1',
    hash: '5021a2185f27ad04d45f1b53c873b2231311aea99e0f1d7a6252167540b9db4c',
};

const BLOCK_160 = {
    height: 160,
    filter: '023eee59053e40',
    hash: '01d37c4490e9ddaf6b5c886eaa215b8d0b658c93ea42cfd871b226f606672c0b',
};

const BLOCK_161 = {
    height: 161,
    filter: '012d70f8',
    hash: '01c8add70f124c8d220d8f82e759ad3d1d0fa8f174dab9a9363a4c36de4e4b44',
};

const BLOCK_162 = {
    height: 162,
    filter: '03018bfa4d4731ee2480',
    hash: '12de06b8ae4bbc660e3f565c876c606f5a1bd3463364c6abfc882b5ff6dd86e3',
};

const BLOCK_163 = {
    height: 163,
    filter: '02782a5165c980',
    hash: '36d01c975372c363d94f0e9e22e8a61a6a52e3408c98920ef1587b024ec487e3',
};

// from blockbook repo
const MEMPOOL_FILTERS = [
    [
        'taproot',
        '86336c62a63f509a278624e3f400cdd50838d035a44e0af8a7d6d133c04cc2d2',
        '0235dddcce5d60',
        [
            'bc1pgeqrcq5capal83ypxczmypjdhk4d9wwcea4k66c7ghe07p2qt97sqh8sy5',
            'bc1p7en40zu9hmf9d3luh8evmfyg655pu5k2gtna6j7zr623f9tz7z0stfnwav',
        ],
    ],
    [
        'taproot multiple',
        '86336c62a63f509a278624e3f400cdd50838d035a44e0af8a7d6d133c04cc2d2',
        '071143e4ad12730965a5247ac15db8c81c89b0bc',
        [
            'bc1pp3752xgfy39w30kggy8vvn0u68x8afwqmq6p96jzr8ffrcvjxgrqrny93y',
            'bc1p5ldsz3zxnjxrwf4xluf4qu7u839c204ptacwe2k0vzfk8s63mwts3njuwr',
            'bc1pgeqrcq5capal83ypxczmypjdhk4d9wwcea4k66c7ghe07p2qt97sqh8sy5',
            'bc1pn2eqtq8h0e7dvahcjm7p098haqrpalquuay572a3vgzjv24p90dszxzg40',
            'bc1p7en40zu9hmf9d3luh8evmfyg655pu5k2gtna6j7zr623f9tz7z0stfnwav',
            'bc1pzdq7tfvrznvfhn66m54j5683pxkatma34em5lgeuvyk6xy0jtyzqjt48z3',
            'bc1pg2edtspjk6pzp07k6n3xhsq4z20pdr58ug40wsllm3ekwz9h6dpq77lhu9',
        ],
    ],
    [
        'taproot duplicities',
        '33a03f983b47725bbdd6045f2d5ee0d95dce08eaaf7104759758aabd8af27d34',
        '01778db0',
        ['bc1px2k5tu5mfq23ekkwncz5apx6ccw2nr0rne25r8t8zk7nu035ryxqn9ge8p'],
    ],
    [
        'partial taproot',
        '86336c62a63f509a278624e3f400cdd50838d035a44e0af8a7d6d133c04cc2d2',
        '011aeee8',
        ['bc1pgeqrcq5capal83ypxczmypjdhk4d9wwcea4k66c7ghe07p2qt97sqh8sy5'],
    ],
] as const;

const MEMPOOL_ADDRS_MISS = [
    'bc1ptxs597p3fnpd8gwut5p467ulsydae3rp9z75hd99w8k3ljr9g9rqx6ynaw',
    'bc1plca7n9vs7d906nwlqyvk0d0jxnxss6x7w3x2y879quuvj8xn3p3s7vrrl2',
    'bc1pks4em3l8vg4zyk5xpcmgygh7elkhu03z3fqj48a2a2lv948cn4hsyltl3h',
    'bc1pvlme5mvcme0mqvfxknqr4mmcajthd9c9vqwknfghgvnsdt0ghtyquf66nq',
    'bc1pu4kdwq4jvpk3psqt6tw38fax7l20xj8y6gtzdgm9dj2amgy6t77sn420ak',
];

describe('Golomb filtering', () => {
    describe('Block filters', () => {
        it('Receive address as input', () => {
            const script = getBlockAddressScript(COINJOIN_RECEIVE_0, NETWORK);
            const filter = getBlockFilter(BLOCK_108.filter, BLOCK_108.hash);
            expect(filter(script)).toBe(true);
        });

        it('Receive address as output', () => {
            const script = getBlockAddressScript(COINJOIN_RECEIVE_0, NETWORK);
            const filter = getBlockFilter(BLOCK_106.filter, BLOCK_106.hash);
            expect(filter(script)).toBe(true);
        });

        it('Receive address nowhere', () => {
            const script = getBlockAddressScript(COINJOIN_RECEIVE_0, NETWORK);
            const filter = getBlockFilter(BLOCK_109.filter, BLOCK_109.hash);
            expect(filter(script)).toBe(false);
        });

        it('Change address as input', () => {
            const script = getBlockAddressScript(COINJOIN_CHANGE_0, NETWORK);
            const filter = getBlockFilter(BLOCK_109.filter, BLOCK_109.hash);
            expect(filter(script)).toBe(true);
        });

        it('Change address as output', () => {
            const script = getBlockAddressScript(COINJOIN_CHANGE_0, NETWORK);
            const filter = getBlockFilter(BLOCK_108.filter, BLOCK_108.hash);
            expect(filter(script)).toBe(true);
        });

        it('Change address nowhere', () => {
            const script = getBlockAddressScript(COINJOIN_CHANGE_0, NETWORK);
            const filter = getBlockFilter(BLOCK_106.filter, BLOCK_106.hash);
            expect(filter(script)).toBe(false);
        });

        it('Bech32 receive address as input', () => {
            const script = getBlockAddressScript(BECH32_RECEIVE_0, NETWORK);
            const filter = getBlockFilter(BLOCK_158.filter, BLOCK_158.hash);
            expect(filter(script)).toBe(true);
        });

        it('Bech32 receive address as output', () => {
            const script = getBlockAddressScript(BECH32_RECEIVE_0, NETWORK);
            const filter = getBlockFilter(BLOCK_157.filter, BLOCK_157.hash);
            expect(filter(script)).toBe(true);
        });

        it('Bech32 change address as input', () => {
            const script = getBlockAddressScript(BECH32_CHANGE_0, NETWORK);
            const filter = getBlockFilter(BLOCK_160.filter, BLOCK_160.hash);
            expect(filter(script)).toBe(true);
        });

        it('Bech32 change address as output', () => {
            const script = getBlockAddressScript(BECH32_CHANGE_0, NETWORK);
            const filter = getBlockFilter(BLOCK_159.filter, BLOCK_159.hash);
            expect(filter(script)).toBe(true);
        });

        it('Taproot receive address as input', () => {
            const script = getBlockAddressScript(TAPROOT_RECEIVE_0, NETWORK);
            const filter = getBlockFilter(BLOCK_162.filter, BLOCK_162.hash);
            expect(filter(script)).toBe(true);
        });

        it('Taproot receive address as output', () => {
            const script = getBlockAddressScript(TAPROOT_RECEIVE_0, NETWORK);
            const filter = getBlockFilter(BLOCK_161.filter, BLOCK_161.hash);
            expect(filter(script)).toBe(true);
        });

        it('Taproot change address as input', () => {
            const script = getBlockAddressScript(TAPROOT_CHANGE_0, NETWORK);
            const filter = getBlockFilter(BLOCK_163.filter, BLOCK_163.hash);
            expect(filter(script)).toBe(true);
        });

        it('Taproot change address as output', () => {
            const script = getBlockAddressScript(TAPROOT_CHANGE_0, NETWORK);
            const filter = getBlockFilter(BLOCK_162.filter, BLOCK_162.hash);
            expect(filter(script)).toBe(true);
        });

        it('Multifilter hit', () => {
            const filter = getBlockMultiFilter(BLOCK_108.filter, BLOCK_108.hash);
            const scripts = [
                getBlockAddressScript(TAPROOT_RECEIVE_0, NETWORK),
                getBlockAddressScript(COINJOIN_CHANGE_0, NETWORK),
                getBlockAddressScript(TAPROOT_CHANGE_0, NETWORK),
            ];
            expect(filter(scripts)).toBe(true);
        });

        it('Multifilter miss', () => {
            const filter = getBlockMultiFilter(BLOCK_106.filter, BLOCK_106.hash);
            const scripts = [
                getBlockAddressScript(TAPROOT_RECEIVE_0, NETWORK),
                getBlockAddressScript(COINJOIN_CHANGE_0, NETWORK),
                getBlockAddressScript(TAPROOT_CHANGE_0, NETWORK),
            ];
            expect(filter(scripts)).toBe(false);
        });
    });

    describe('Mempool filters', () => {
        MEMPOOL_FILTERS.forEach(([desc, txid, filterHex, hits]) => {
            it(desc, () => {
                const filter = getMempoolFilter(filterHex, txid);
                hits.forEach(hit => {
                    const script = getMempoolAddressScript(hit, networks.bitcoin);
                    expect(filter(script)).toBe(true);
                });
                MEMPOOL_ADDRS_MISS.forEach(miss => {
                    const script = getMempoolAddressScript(miss, networks.bitcoin);
                    expect(filter(script)).toBe(false);
                });
            });
        });
    });
});
