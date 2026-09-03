import { BigNumber } from '@trezor/utils';

import { toStroops } from '../../constants';
import * as fixtures from './__fixtures__/transactions.fixture';

import {
    buildAddTrustlineTransaction,
    buildRemoveTrustlineTransaction,
    buildSendTransaction,
    transformTransaction,
} from './index';

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
                    memo: input.memo,
                    isTestnet: input.isTestnet,
                });
                expect(result).toEqual(expectedOutput);
            });
        });
    });

    describe('buildAddTrustlineTransaction', () => {
        fixtures.buildAddTrustlineTransaction.forEach(({ description, input, expectedOutput }) => {
            it(description, () => {
                const result = buildAddTrustlineTransaction({
                    descriptor: input.descriptor,
                    sequence: input.sequence,
                    fee: input.fee,
                    asset: input.asset,
                    memo: input.memo,
                    isTestnet: input.isTestnet,
                });
                expect(result).toEqual(expectedOutput);
            });
        });
    });

    describe('buildRemoveTrustlineTransaction', () => {
        fixtures.buildRemoveTrustlineTransaction.forEach(
            ({ description, input, expectedOutput }) => {
                it(description, () => {
                    const result = buildRemoveTrustlineTransaction({
                        descriptor: input.descriptor,
                        sequence: input.sequence,
                        fee: input.fee,
                        asset: input.asset,
                        memo: input.memo,
                        isTestnet: input.isTestnet,
                    });
                    expect(result).toEqual(expectedOutput);
                });
            },
        );
    });
});
