import { Horizon } from '@stellar/stellar-sdk';

import type { StellarAsset } from '@trezor/protobuf/src/messages';
import { BigNumber } from '@trezor/utils';

import { buildSendTransaction, toStroops, transformTransaction } from '../stellar';
import { fixtures } from './fixtures/stellar';

describe('stellar/utils', () => {
    describe('transformTransaction', () => {
        fixtures.transformTransaction.forEach(({ description, input, expectedOutput }) => {
            it(description, () => {
                const result = transformTransaction(
                    // @ts-expect-error Fixtures don't fully implement this interface.
                    input.tx as Horizon.ServerApi.TransactionRecord,
                    input.descriptor,
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
                const result = buildSendTransaction(
                    input.descriptor,
                    input.sequence,
                    input.fee,
                    input.destinationActivated,
                    input.destination,
                    input.amount,
                    input.asset as StellarAsset,
                    input.destinationTag,
                    input.isTestnet,
                );
                expect(result).toEqual(expectedOutput);
            });
        });
    });
});
