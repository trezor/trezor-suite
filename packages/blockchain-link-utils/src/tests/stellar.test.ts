import { type Horizon } from '@stellar/stellar-sdk';

import { BigNumber } from '@trezor/utils';

import {
    type StellarAsset,
    buildSendTransaction,
    computeSorobanAssetContractId,
    toStroops,
    transformTransaction,
} from '../stellar';
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

    describe('computeSorobanAssetContractId', () => {
        const classic = 'USDC-GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN';
        const expectedSACId = 'CCW67TSZV3SSS2HXMBQ5JFGCKJNXKZM7UQUWUZPUTHXSTZLEO7SJMI75';

        it('derives the Soroban contract id from a classic CODE-ISSUER', () => {
            expect(computeSorobanAssetContractId(classic)).toBe(expectedSACId);
        });

        it('throws when the input is not in strict CODE-ISSUER format', () => {
            expect(() => computeSorobanAssetContractId(classic.replace('-', ':'))).toThrow(
                'Invalid Stellar asset contract format.',
            );
            expect(() => computeSorobanAssetContractId(`${classic}-1`)).toThrow(
                'Invalid Stellar asset contract format.',
            );
            expect(() => computeSorobanAssetContractId(expectedSACId)).toThrow(
                'Invalid Stellar asset contract format.',
            );
            expect(() => computeSorobanAssetContractId('not-stellar')).toThrow(
                'Invalid Stellar asset contract format.',
            );
        });
    });
});
