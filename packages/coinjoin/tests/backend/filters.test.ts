import { networks } from '@trezor/utxo-lib';

import { getAddressScript, getFilter } from '../../src/backend/filters';

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

describe('Golomb filtering', () => {
    it('Receive address as input', () => {
        const script = getAddressScript(COINJOIN_RECEIVE_0, NETWORK);
        const filter = getFilter(BLOCK_108.filter, BLOCK_108.hash);
        expect(filter(script)).toBe(true);
    });

    it('Receive address as output', () => {
        const script = getAddressScript(COINJOIN_RECEIVE_0, NETWORK);
        const filter = getFilter(BLOCK_106.filter, BLOCK_106.hash);
        expect(filter(script)).toBe(true);
    });

    it('Receive address nowhere', () => {
        const script = getAddressScript(COINJOIN_RECEIVE_0, NETWORK);
        const filter = getFilter(BLOCK_109.filter, BLOCK_109.hash);
        expect(filter(script)).toBe(false);
    });

    it('Change address as input', () => {
        const script = getAddressScript(COINJOIN_CHANGE_0, NETWORK);
        const filter = getFilter(BLOCK_109.filter, BLOCK_109.hash);
        expect(filter(script)).toBe(true);
    });

    it('Change address as output', () => {
        const script = getAddressScript(COINJOIN_CHANGE_0, NETWORK);
        const filter = getFilter(BLOCK_108.filter, BLOCK_108.hash);
        expect(filter(script)).toBe(true);
    });

    it('Change address nowhere', () => {
        const script = getAddressScript(COINJOIN_CHANGE_0, NETWORK);
        const filter = getFilter(BLOCK_106.filter, BLOCK_106.hash);
        expect(filter(script)).toBe(false);
    });

    it('Bech32 receive address as input', () => {
        const script = getAddressScript(BECH32_RECEIVE_0, NETWORK);
        const filter = getFilter(BLOCK_158.filter, BLOCK_158.hash);
        expect(filter(script)).toBe(true);
    });

    it('Bech32 receive address as output', () => {
        const script = getAddressScript(BECH32_RECEIVE_0, NETWORK);
        const filter = getFilter(BLOCK_157.filter, BLOCK_157.hash);
        expect(filter(script)).toBe(true);
    });

    it('Bech32 change address as input', () => {
        const script = getAddressScript(BECH32_CHANGE_0, NETWORK);
        const filter = getFilter(BLOCK_160.filter, BLOCK_160.hash);
        expect(filter(script)).toBe(true);
    });

    it('Bech32 change address as output', () => {
        const script = getAddressScript(BECH32_CHANGE_0, NETWORK);
        const filter = getFilter(BLOCK_159.filter, BLOCK_159.hash);
        expect(filter(script)).toBe(true);
    });

    it('Taproot receive address as input', () => {
        const script = getAddressScript(TAPROOT_RECEIVE_0, NETWORK);
        const filter = getFilter(BLOCK_162.filter, BLOCK_162.hash);
        expect(filter(script)).toBe(true);
    });

    it('Taproot receive address as output', () => {
        const script = getAddressScript(TAPROOT_RECEIVE_0, NETWORK);
        const filter = getFilter(BLOCK_161.filter, BLOCK_161.hash);
        expect(filter(script)).toBe(true);
    });

    it('Taproot change address as input', () => {
        const script = getAddressScript(TAPROOT_CHANGE_0, NETWORK);
        const filter = getFilter(BLOCK_163.filter, BLOCK_163.hash);
        expect(filter(script)).toBe(true);
    });

    it('Taproot change address as output', () => {
        const script = getAddressScript(TAPROOT_CHANGE_0, NETWORK);
        const filter = getFilter(BLOCK_162.filter, BLOCK_162.hash);
        expect(filter(script)).toBe(true);
    });
});
