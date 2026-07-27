import { BigNumber } from '@trezor/utils';

import * as fixtures from './transactions.fixture';
import { toStroops } from '../src/constants';
import { buildSendTransaction, transformTransaction } from '../src/runtime/transactions';

describe('transactions', () => {
    describe('toStroops', () => {
        fixtures.toStroops.forEach(({ description, input, expectedOutput }) => {
            it(description, () => {
                const result = toStroops(input);
                expect(result).toEqual(new BigNumber(expectedOutput));
            });
        });
    });

    describe('transformTransaction', () => {
        fixtures.transformTransactionInputs.forEach(f => {
            it(f.description, () => {
                const resp = transformTransaction(f.tx);
                expect(resp).toEqual(f.result);
            });
        });
    });

    describe('buildSendTransaction', () => {
        fixtures.buildSendTransaction.forEach(({ description, input, expectedOutput }) => {
            it(description, () => {
                const result = buildSendTransaction({
                    descriptor: input.descriptor,
                    sequence: input.sequence,
                    fee: input.fee,
                    destinationActivated: input.destinationActivated,
                    destination: input.destination,
                    amount: input.amount,
                    asset: input.asset,
                    destinationTag: input.destinationTag,
                    isTestnet: input.isTestnet,
                });
                expect(result).toEqual(expectedOutput);
            });
        });
    });
});
