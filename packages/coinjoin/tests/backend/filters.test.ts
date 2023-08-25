import { networks } from '@trezor/utxo-lib';

import { getAddressScript, getFilter, getMultiFilter } from '../../src/backend/filters';

// from blockbook repo
const FIXTURES = [
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
    [
        'all',
        '86336c62a63f509a278624e3f400cdd50838d035a44e0af8a7d6d133c04cc2d2',
        '0350ccc61ac611976c80',
        [
            'bc1pgeqrcq5capal83ypxczmypjdhk4d9wwcea4k66c7ghe07p2qt97sqh8sy5',
            'bc1p7en40zu9hmf9d3luh8evmfyg655pu5k2gtna6j7zr623f9tz7z0stfnwav',
            '39ECUF8YaFRX7XfttfAiLa5ir43bsrQUZJ',
        ],
    ],
    ['empty', '86336c62a63f509a278624e3f400cdd50838d035a44e0af8a7d6d133c04cc2d2', '', []],
] as const;

const ADDRS_MISS = [
    'bc1ptxs597p3fnpd8gwut5p467ulsydae3rp9z75hd99w8k3ljr9g9rqx6ynaw',
    'bc1plca7n9vs7d906nwlqyvk0d0jxnxss6x7w3x2y879quuvj8xn3p3s7vrrl2',
    'bc1pks4em3l8vg4zyk5xpcmgygh7elkhu03z3fqj48a2a2lv948cn4hsyltl3h',
    'bc1pvlme5mvcme0mqvfxknqr4mmcajthd9c9vqwknfghgvnsdt0ghtyquf66nq',
    'bc1pu4kdwq4jvpk3psqt6tw38fax7l20xj8y6gtzdgm9dj2amgy6t77sn420ak',
];

describe('Golomb filtering', () => {
    const missScripts = ADDRS_MISS.map(miss => getAddressScript(miss, networks.bitcoin));

    describe('match', () => {
        FIXTURES.forEach(([desc, key, filterHex, hits]) => {
            it(desc, () => {
                const filter = getFilter(filterHex, { key });
                hits.forEach(hit => {
                    const script = getAddressScript(hit, networks.bitcoin);
                    expect(filter(script)).toBe(true);
                });
                missScripts.forEach(script => {
                    expect(filter(script)).toBe(false);
                });
            });
        });
    });

    describe('matchAny', () => {
        FIXTURES.forEach(([desc, key, filterHex, hits]) => {
            it(desc, () => {
                const filter = getMultiFilter(filterHex, { key });
                const hitScripts = hits.map(hit => getAddressScript(hit, networks.bitcoin));

                expect(filter([])).toBe(false);
                expect(filter(missScripts)).toBe(false);
                if (hitScripts.length) {
                    expect(filter(hitScripts)).toBe(true);
                    expect(filter([...missScripts, hitScripts[0]])).toBe(true);
                    expect(filter([...hitScripts, ...missScripts])).toBe(true);
                }
            });
        });
    });
});
