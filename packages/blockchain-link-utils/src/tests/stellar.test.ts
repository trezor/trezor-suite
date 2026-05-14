// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { identifyTransaction } from '@trezor/coins-stellar';
import type { RawStellarTransaction } from '@trezor/coins-stellar/types';

import { transformTransaction } from '../stellar';
import { fixtures } from './fixtures/stellar';

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
