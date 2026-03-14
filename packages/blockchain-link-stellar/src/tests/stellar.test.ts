import { Horizon } from '@stellar/stellar-sdk';

import { BigNumber } from '@trezor/utils';

import { StellarAsset, buildSendTransaction, toStroops, transformTransaction } from '../utils';
import { fixtures } from './fixtures/stellar';

describe('stellar/utils', () => {
    describe('transformTransaction', () => {
        fixtures.transformTransaction.forEach(({ description, input, expectedOutput }) => {
            it(description, () => {
                const result = transformTransaction(
                    // @ts-expect-error Fixtures don't fully implement this interface.
                    input.tx as Horizon.ServerApi.TransactionRecord,
                    input.descriptor,
                    {},
                );
                expect(result).toEqual(expectedOutput);
            });
        });
    });

    describe('toStroops', () => {
        fixtures.toStroops.forEach(({ description, input, expectedOutput }) => {
            it(description, () => {
                const result = toStroops(input);
                expect(result).toEqual(new BigNumber(expectedOutput));
            });
        });
    });

    describe('buildSendTransactoin', () => {
        fixtures.buildSendTransactoin.forEach(({ description, input, expectedOutput }) => {
            it(description, () => {
                const result = buildSendTransaction({
                    descriptor: input.descriptor,
                    sequence: input.sequence,
                    fee: input.fee,
                    destinationActivated: input.destinationActivated,
                    destination: input.destination,
                    amount: input.amount,
                    asset: input.asset as StellarAsset,
                    destinationTag: input.destinationTag,
                    isTestnet: input.isTestnet,
                });
                expect(result).toEqual(expectedOutput);
            });
        });
    });
});
