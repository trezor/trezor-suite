import * as CardanoWasm from '@emurgo/cardano-serialization-lib-nodejs';

import * as utils from './common';
import { DEFAULT_PROTOCOL_PARAMS, getDataCost } from './protocolParams';
import * as fixtures from '../../mocks/mockCommon';
import { changeAddress } from '../../mocks/mockConstants';
import { mockProtocolParams } from '../../mocks/mockProtocolParams';
import { CertificateType } from '../constants';
import { type Certificate } from '../types/types';

const defaultDataCost = getDataCost(DEFAULT_PROTOCOL_PARAMS);

describe('common utils', () => {
    test('multiAssetToArray', () => {
        const multiAsset = utils.buildMultiAsset([
            {
                quantity: '1000',
                unit: '02477d7c23b4c2834b0be8ca8578dde47af0cc82a964688f6fc95a7a47524943',
            },
        ]);
        const res = utils.multiAssetToArray(multiAsset);
        expect(res).toMatchObject([
            {
                quantity: '1000',
                unit: '02477d7c23b4c2834b0be8ca8578dde47af0cc82a964688f6fc95a7a47524943',
            },
        ]);
    });

    fixtures.filterUtxos.forEach(f => {
        test(f.description, () => {
            expect(utils.filterUtxos(f.utxos, f.asset)).toMatchObject(f.result);
        });
    });

    fixtures.buildTxOutput.forEach(f => {
        test(f.description, () => {
            const output = utils.buildTxOutput(f.output, f.dummyAddress, defaultDataCost);
            const assets = utils.multiAssetToArray(output.amount().multiasset());

            let address;
            if (CardanoWasm.ByronAddress.is_valid(f.result.address)) {
                // expecting byron address
                address = CardanoWasm.ByronAddress.from_bytes(
                    output.address().to_bytes(),
                ).to_base58();
            } else {
                address = output.address().to_bech32(); // by default expect shelley
            }
            expect(output.amount().coin().to_str()).toBe(f.result.amount);
            expect(address).toBe(f.result.address);
            expect(assets).toStrictEqual(f.result.assets);
        });
    });

    fixtures.orderInputs.forEach(f => {
        test(f.description, () => {
            const inputs = utils.orderInputs(
                f.inputsToOrder,
                CardanoWasm.TransactionBody.from_bytes(Buffer.from(f.txBodyHex, 'hex')),
            );
            expect(inputs).toStrictEqual(f.result);
        });
    });

    describe('calculateRequiredDeposit', () => {
        const stakeRegistration: Certificate = { type: CertificateType.STAKE_REGISTRATION };
        const stakeDeregistration: Certificate = { type: CertificateType.STAKE_DEREGISTRATION };
        const stakeDelegation: Certificate = {
            type: CertificateType.STAKE_DELEGATION,
            pool: '0f292fcaa02b8b2f9b3c8f9fd8e0bb21abedb692a6d5058df3ef2735',
        };
        const poolRegistration: Certificate = {
            type: CertificateType.STAKE_POOL_REGISTRATION,
            pool_parameters: {},
        };

        test('uses default deposits', () => {
            expect(
                utils.calculateRequiredDeposit([stakeRegistration], DEFAULT_PROTOCOL_PARAMS),
            ).toBe(2000000);
            expect(
                utils.calculateRequiredDeposit([stakeDeregistration], DEFAULT_PROTOCOL_PARAMS),
            ).toBe(-2000000);
            expect(utils.calculateRequiredDeposit([stakeDelegation], DEFAULT_PROTOCOL_PARAMS)).toBe(
                0,
            );
            expect(
                utils.calculateRequiredDeposit([poolRegistration], DEFAULT_PROTOCOL_PARAMS),
            ).toBe(500000000);
        });

        test('uses provided deposits', () => {
            const protocolParams = mockProtocolParams({
                keyDeposit: '3000000',
                poolDeposit: '600000000',
            });

            expect(
                utils.calculateRequiredDeposit(
                    [stakeRegistration, stakeDelegation],
                    protocolParams,
                ),
            ).toBe(3000000);
            expect(utils.calculateRequiredDeposit([stakeDeregistration], protocolParams)).toBe(
                -3000000,
            );
            expect(utils.calculateRequiredDeposit([poolRegistration], protocolParams)).toBe(
                600000000,
            );
        });
    });

    describe('getTxBuilder', () => {
        test('min fee of an empty transaction equals minFeeB when minFeeA is zero', () => {
            const txBuilder = utils.getTxBuilder(
                mockProtocolParams({ minFeeA: '0', minFeeB: '200000' }),
            );

            expect(txBuilder.min_fee().to_str()).toBe('200000');
        });

        test('min fee grows with minFeeA', () => {
            const defaultFee = utils.getTxBuilder(DEFAULT_PROTOCOL_PARAMS).min_fee();
            const doubledFee = utils.getTxBuilder(mockProtocolParams({ minFeeA: '88' })).min_fee();

            expect(doubledFee.compare(defaultFee)).toBe(1);
        });
    });

    describe('buildTxOutput', () => {
        const tokenOutput = {
            address: changeAddress,
            amount: '0',
            assets: [
                {
                    quantity: '1000',
                    unit: '02477d7c23b4c2834b0be8ca8578dde47af0cc82a964688f6fc95a7a47524943',
                },
            ],
        };

        test('min ADA of a token output scales with coinsPerUtxoByte', () => {
            const defaultMinAda = utils
                .buildTxOutput(tokenOutput, changeAddress, defaultDataCost)
                .amount()
                .coin();
            const doubledMinAda = utils
                .buildTxOutput(
                    tokenOutput,
                    changeAddress,
                    getDataCost(mockProtocolParams({ coinsPerUtxoByte: '8620' })),
                )
                .amount()
                .coin();

            expect(doubledMinAda.to_str()).toBe(
                defaultMinAda.checked_mul(CardanoWasm.BigNum.from_str('2')).to_str(),
            );
        });
    });
});
