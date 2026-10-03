// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { describeTransaction } from '@trezor/network-stellar';

import { fixtures } from './__fixtures__/stellar';
import { transformTransaction } from './stellar';

describe('stellar/utils', () => {
    describe('transformTransaction', () => {
        fixtures.transformTransaction.forEach(({ description, input, expectedOutput }) => {
            it(description, () => {
                const result = transformTransaction(
                    // @ts-expect-error Fixtures don't fully implement the Horizon interfaces.
                    describeTransaction(input.operations, input.tx, input.effects ?? []),
                    input.descriptor,
                    {},
                );
                expect(result).toEqual(expectedOutput);
            });
        });
    });
});
