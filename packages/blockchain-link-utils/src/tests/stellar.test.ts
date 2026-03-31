import { type Horizon } from '@stellar/stellar-sdk';

import { BigNumber } from '@trezor/utils';

import {
    type StellarAsset,
    buildSendTransaction,
    computeSorobanAssetContractId,
    extractNativeBalanceDelta,
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

    describe('extractNativeBalanceDelta', () => {
        const descriptor = 'GB635ARCRZOV7YZ5KC2BRIBFRHOCBJ5E35O76H3VUAMJP7UDTXFHG5C4';
        const destination = 'GBIWBIL2MJMQ24H6ZMEFUGVK7LZ2CRGL6MH52A4FVKVYLZ27LUFS63UU';
        const nativeAsset: StellarAsset = { type: 'NATIVE' };

        const createRecord = ({
            tx,
            feeCharged = '100',
            source = descriptor,
            successful = true,
        }: {
            feeCharged?: string;
            source?: string;
            successful?: boolean;
            tx: ReturnType<typeof buildSendTransaction>;
        }) =>
            ({
                created_at: '2026-03-31T10:00:00Z',
                envelope_xdr: tx.toXDR(),
                fee_charged: feeCharged,
                source_account: source,
                successful,
            }) as unknown as Horizon.ServerApi.TransactionRecord;

        it('subtracts sent amount and fee for a native payment source account', () => {
            const tx = buildSendTransaction({
                descriptor,
                sequence: '1',
                fee: '100',
                destinationActivated: true,
                destination,
                amount: '2.5',
                asset: nativeAsset,
            });

            expect(extractNativeBalanceDelta(createRecord({ tx }), descriptor).toFixed(0)).toEqual(
                toStroops('-2.50001').toFixed(0),
            );
        });

        it('adds received amount for a native payment destination account', () => {
            const tx = buildSendTransaction({
                descriptor,
                sequence: '1',
                fee: '100',
                destinationActivated: true,
                destination,
                amount: '2.5',
                asset: nativeAsset,
            });

            expect(extractNativeBalanceDelta(createRecord({ tx }), destination).toFixed(0)).toEqual(
                toStroops('2.5').toFixed(0),
            );
        });

        it('applies only the fee for failed source transactions', () => {
            const tx = buildSendTransaction({
                descriptor,
                sequence: '1',
                fee: '100',
                destinationActivated: true,
                destination,
                amount: '2.5',
                asset: nativeAsset,
            });

            expect(
                extractNativeBalanceDelta(
                    createRecord({
                        tx,
                        successful: false,
                    }),
                    descriptor,
                ).toFixed(0),
            ).toEqual('-100');
        });

        it('handles createAccount funding for the new destination', () => {
            const tx = buildSendTransaction({
                descriptor,
                sequence: '1',
                fee: '100',
                destinationActivated: false,
                destination,
                amount: '3',
                asset: nativeAsset,
            });

            expect(extractNativeBalanceDelta(createRecord({ tx }), destination).toFixed(0)).toEqual(
                toStroops('3').toFixed(0),
            );
        });
    });
});
