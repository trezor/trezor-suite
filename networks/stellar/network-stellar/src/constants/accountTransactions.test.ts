import { fixtures } from './__fixtures__/accountTransactions';
import { transformStellarTransaction } from './accountTransactions';
import { describeTransaction } from '../runtime/transactions/describe';

describe(transformStellarTransaction.name, () => {
    fixtures.transformTransaction.forEach(({ description, input, expectedOutput }) => {
        it(description, () => {
            const result = transformStellarTransaction(
                // @ts-expect-error Fixtures don't fully implement the Horizon interfaces.
                describeTransaction(input.operations, input.tx, input.effects ?? []),
                input.descriptor,
                {},
            );
            expect(result).toEqual(expectedOutput);
        });
    });
});
