// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { identifyTransaction } from '@trezor/network-stellar';
import type { RawStellarTransaction } from '@trezor/network-stellar/types';

import { fixtures } from './__fixtures__/stellar';
import { transformTransaction } from './stellar';

describe('stellar/utils', () => {
    describe('transformTransaction', () => {
        fixtures.transformTransaction.forEach(({ description, input, expectedOutput }) => {
            it(description, () => {
                const result = transformTransaction(
                    // @ts-expect-error Fixtures don't fully implement this interface.
                    identifyTransaction(input.tx as RawStellarTransaction),
                    input.descriptor,
                    {},
                );
                expect(result).toEqual(expectedOutput);
            });
        });
    });
});
