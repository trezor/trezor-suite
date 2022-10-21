import { deriveAddresses as deriveAddressesOriginal } from '@trezor/utxo-lib';

import { deriveAddresses } from '../../src/backend/backendUtils';
import { SEGWIT_XPUB } from '../fixtures/methods.fixture';

const PARAMS = [SEGWIT_XPUB, 'receive', 0, 10] as const;
const ADDRESSES = deriveAddressesOriginal(...PARAMS);

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
});
