import { deriveAddresses as deriveAddressesOriginal, networks } from '@trezor/utxo-lib';

import { deriveAddresses, isTaprootTx, doesTxContainAddress } from '../../src/backend/backendUtils';
import { SEGWIT_XPUB, SEGWIT_RECEIVE_ADDRESSES } from '../fixtures/methods.fixture';

const PARAMS = [SEGWIT_XPUB, 'receive', 0, 10] as const;
const ADDRESSES = deriveAddressesOriginal(...PARAMS);

const TAPROOT_ADDRESS = 'bcrt1pswrqtykue8r89t9u4rprjs0gt4qzkdfuursfnvqaa3f2yql07zmq2fdmpx';

const NON_TAPROOT_TX = {
    vin: [{ addresses: SEGWIT_RECEIVE_ADDRESSES.slice(1, 3) }, {}, { addresses: [] }],
    vout: [{ addresses: [SEGWIT_RECEIVE_ADDRESSES[0]] }],
};

const TAPROOT_TX = {
    ...NON_TAPROOT_TX,
    vout: [{ addresses: [TAPROOT_ADDRESS] }, ...NON_TAPROOT_TX.vout],
};

describe('backendUtils', () => {
    describe('deriveAddresses', () => {
        it('whole, empty prederived', () => {
            expect(deriveAddresses(undefined, ...PARAMS)).toEqual(ADDRESSES);
        });

        it('whole, full prederived', () => {
            expect(deriveAddresses(ADDRESSES, ...PARAMS)).toEqual(ADDRESSES);
        });

        it('whole, half prederived', () => {
            expect(deriveAddresses(ADDRESSES.slice(0, 5), ...PARAMS)).toEqual(ADDRESSES);
        });

        it('part, empty prederived', () => {
            expect(deriveAddresses(undefined, SEGWIT_XPUB, 'receive', 3, 5)).toEqual(
                ADDRESSES.slice(3, 8),
            );
        });

        it('part, full prederived', () => {
            expect(deriveAddresses(ADDRESSES, SEGWIT_XPUB, 'receive', 3, 5)).toEqual(
                ADDRESSES.slice(3, 8),
            );
        });

        it('part, half prederived', () => {
            expect(deriveAddresses(ADDRESSES.slice(0, 5), SEGWIT_XPUB, 'receive', 3, 5)).toEqual(
                ADDRESSES.slice(3, 8),
            );
        });
    });

    describe('isTaprootTx', () => {
        it('taproot tx', () => {
            expect(isTaprootTx(TAPROOT_TX, networks.regtest)).toBe(true);
        });

        it('non-taproot tx', () => {
            expect(isTaprootTx(NON_TAPROOT_TX, networks.regtest)).toBe(false);
        });
    });

    describe('doesTxContainAddress', () => {
        it('containing', () => {
            expect(doesTxContainAddress(TAPROOT_ADDRESS)(TAPROOT_TX)).toBe(true);
        });

        it('not containing', () => {
            expect(doesTxContainAddress(TAPROOT_ADDRESS)(NON_TAPROOT_TX)).toBe(false);
        });
    });
});
