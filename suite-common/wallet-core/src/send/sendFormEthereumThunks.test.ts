import { type FeeLevel } from '@trezor/connect';

import * as fixtures from './__fixtures__/sendFormEthereumThunks.fixtures';
import { calculate } from './sendFormEthereumThunks';

describe(calculate.name, () => {
    fixtures.calculate.forEach(f => {
        it(`${f.description}`, () => {
            const result = calculate(
                f.input.availableBalance,
                f.input.output,
                f.input.feeLevel,
                f.input.token,
            );

            expect(result).toEqual(f.result);
        });
    });
});

describe('Ethereum balance shortfall classification', () => {
    it.each([
        {
            description: 'amount fits but fee does not',
            balance: '1000100000000000000',
            error: 'AMOUNT_NOT_ENOUGH_CURRENCY_FEE',
        },
        {
            description: 'amount uses the exact balance',
            balance: '1000000000000000000',
            error: 'AMOUNT_NOT_ENOUGH_CURRENCY_FEE',
        },
        {
            description: 'one wei below amount plus fee',
            balance: '1000209999999999999',
            error: 'AMOUNT_NOT_ENOUGH_CURRENCY_FEE',
        },
        {
            description: 'amount itself exceeds the balance',
            balance: '999999999999999999',
            error: 'AMOUNT_IS_NOT_ENOUGH',
        },
        {
            description: 'exact coverage of amount plus fee',
            balance: '1000210000000000000',
            error: undefined,
        },
    ])('$description', ({ balance, error }) => {
        const feeLevel: FeeLevel = {
            label: 'normal',
            feePerUnit: '10',
            feeLimit: '21000',
            blocks: 1,
        };
        const result = calculate(
            balance,
            { type: 'payment', address: 'A', amount: '1000000000000000000' },
            feeLevel,
        );

        if (error) {
            expect(result).toEqual({ type: 'error', error, errorMessage: { id: error } });
        } else {
            expect(result).toMatchObject({
                type: 'final',
                fee: '210000000000000',
                totalSpent: balance,
            });
        }
    });
});
