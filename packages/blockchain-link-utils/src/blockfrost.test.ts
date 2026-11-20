import type { AccountAddresses, BlockfrostTransaction } from '@trezor/blockchain-link-types';

import fixtures from './__fixtures__/blockfrost';
import {
    createTransactionTransformer,
    parseAsset,
    transformAccountInfo,
    transformInputOutput,
    transformProtocolParameters,
    transformTokenInfo,
    transformTransaction,
    transformUtxos,
} from './blockfrost';

describe('blockfrost/utils', () => {
    describe('transformUtxos', () => {
        fixtures.transformUtxos.forEach(f => {
            it(f.description, () => {
                // @ts-expect-error incorrect params
                expect(transformUtxos(f.utxos)).toEqual(f.result);
            });
        });
    });

    describe('parseAsset', () => {
        fixtures.parseAsset.forEach(f => {
            it(f.description, () => {
                expect(parseAsset(f.hex)).toEqual(f.result);
            });
        });
    });

    describe('transformTokenInfo', () => {
        fixtures.transformTokenInfo.forEach(f => {
            it(f.description, () => {
                expect(transformTokenInfo(f.tokens)).toEqual(f.result);
            });
        });
    });

    describe('transformInputOutput', () => {
        fixtures.transformInputOutput.forEach(f => {
            it(f.description, () => {
                // @ts-expect-error incorrect params
                expect(transformInputOutput(f.data, f.asset)).toEqual(f.result);
            });
        });
    });

    describe('transformTransaction', () => {
        fixtures.transformTransaction.forEach(f => {
            it(f.description, () => {
                expect(
                    // @ts-expect-error incorrect params
                    transformTransaction(f.data, f.accountAddress ?? f.descriptor),
                ).toMatchObject(f.result);
            });
        });
    });

    describe('createTransactionTransformer', () => {
        fixtures.transformTransaction.forEach(f => {
            it(f.description, () => {
                expect(
                    // @ts-expect-error incorrect params
                    createTransactionTransformer(f.accountAddress ?? f.descriptor)(f.data),
                ).toMatchObject(f.result);
            });
        });
    });

    describe('transformAccountInfo', () => {
        fixtures.transformAccountInfo.forEach(f => {
            it(f.description, () => {
                // @ts-expect-error incorrect params
                expect(transformAccountInfo(f.data)).toEqual(f.result);
            });
        });
    });

    describe('transformProtocolParameters', () => {
        const epochParameters = {
            epoch: 656,
            min_fee_a: 44,
            min_fee_b: 155381,
            max_tx_size: 16384,
            max_val_size: '5000',
            key_deposit: '2000000',
            pool_deposit: '500000000',
            coins_per_utxo_size: '4310',
        };

        it('maps Blockfrost epoch parameters', () => {
            expect(transformProtocolParameters(epochParameters)).toEqual({
                epoch: 656,
                minFeeA: '44',
                minFeeB: '155381',
                maxTxSize: 16384,
                maxValueSize: 5000,
                keyDeposit: '2000000',
                poolDeposit: '500000000',
                coinsPerUtxoByte: '4310',
            });
        });

        it('keeps nullable fields as null', () => {
            expect(
                transformProtocolParameters({
                    ...epochParameters,
                    max_val_size: null,
                    coins_per_utxo_size: null,
                }),
            ).toMatchObject({ maxValueSize: null, coinsPerUtxoByte: null });
        });
    });

    describe('transformTransaction - collateral handling (valid_contract)', () => {
        const myAddress =
            'addr1q9f9jr6e48u63ym65esmrwgle84zspnrsew37gwe88e0zfy9ckxhkvuc5xj49rw6zrp443wlygmhv8gwcu38jk6ms6usxwwdwc';
        const otherAddress =
            'addr1q8u5ktsj5zsmhvwv0ep9zuhfu39x3wyt9wxjnsn3cagsyy59ckxhkvuc5xj49rw6zrp443wlygmhv8gwcu38jk6ms6usrmcafl';

        const baseTxData = {
            hash: 'deadbeef',
            block: 'deadbeef',
            block_height: 1,
            block_time: 1,
            slot: 1,
            index: 0,
            output_amount: [
                {
                    unit: 'lovelace',
                    quantity: '10000000',
                    decimals: 6,
                    ticker: 'ADA',
                    name: 'Cardano',
                },
            ],
            fees: '200000',
            deposit: '0',
            size: 100,
            invalid_before: null,
            invalid_hereafter: null,
            utxo_count: 2,
            withdrawal_count: 0,
            mir_cert_count: 0,
            delegation_count: 0,
            stake_cert_count: 0,
            pool_update_count: 0,
            pool_retire_count: 0,
            asset_mint_or_burn_count: 0,
            redeemer_count: 1,
        };

        it.each([true, false])(
            'counts realized transfers once (valid_contract=%s)',
            (validContract: boolean) => {
                const token = {
                    unit: 'b863bc7369f46136ac1048adb2fa7dae3af944c3bbb2be2f216a8d4f42657272795361707068697265',
                    quantity: '7',
                    decimals: 1,
                    ticker: 'BerrySapphire',
                    name: 'Berry',
                    fingerprint: 'asset1hwnpal5vap799t6kkjmjf6myhse4zl2vu4ahzz',
                };
                const addresses: AccountAddresses = {
                    used: [
                        {
                            address: myAddress,
                            path: '',
                            transfers: 0,
                            balance: '0',
                            sent: '0',
                            received: '0',
                        },
                    ],
                    unused: [],
                    change: [],
                };
                const input = {
                    address: myAddress,
                    amount: [
                        {
                            unit: 'lovelace',
                            quantity: '2000000',
                            decimals: 6,
                            ticker: 'ADA',
                            name: 'Cardano',
                        },
                        token,
                    ],
                    tx_hash: 'a',
                    output_index: 0,
                    data_hash: null,
                };
                const output = {
                    address: myAddress,
                    amount: [
                        {
                            unit: 'lovelace',
                            quantity: '1800000',
                            decimals: 6,
                            ticker: 'ADA',
                            name: 'Cardano',
                        },
                        token,
                    ],
                    output_index: 1,
                };
                const tx: BlockfrostTransaction = {
                    address: myAddress,
                    txHash: 'deadbeef',
                    txData: {
                        ...baseTxData,
                        output_amount: output.amount,
                        valid_contract: validContract,
                    },
                    txUtxos: {
                        hash: 'deadbeef',
                        inputs: validContract
                            ? [
                                  { ...input, collateral: false },
                                  { ...input, amount: input.amount.slice(0, 1), collateral: true },
                              ]
                            : [{ ...input, collateral: false }],
                        outputs: validContract
                            ? [
                                  { ...output, collateral: false },
                                  {
                                      ...output,
                                      amount: output.amount.slice(0, 1),
                                      output_index: 2,
                                      collateral: true,
                                  },
                              ]
                            : [{ ...output, collateral: false }],
                    },
                };
                for (const result of [
                    transformTransaction(tx, addresses),
                    createTransactionTransformer(addresses)(tx),
                ]) {
                    expect(result.type).toBe('self');
                    expect(result.amount).toBe('200000');
                    expect(result.fee).toBe('200000');
                    expect(result.tokens).toHaveLength(1);
                    expect(result.tokens[0]).toMatchObject({ amount: '7', contract: token.unit });
                    expect(result.details.totalInput).toBe('2000000');
                    expect(result.details.totalOutput).toBe('1800000');
                    expect(result.details.vin).toHaveLength(1);
                    expect(result.targets).toHaveLength(1);
                    expect(result.cardanoSpecific?.subtype).toBeUndefined();
                }
                const changeAddresses: AccountAddresses = {
                    used: [],
                    unused: [],
                    change: addresses.used,
                };
                for (const result of [
                    transformTransaction(tx, changeAddresses),
                    createTransactionTransformer(changeAddresses)(tx),
                ]) {
                    expect(result.cardanoSpecific?.subtype).toBeUndefined();
                }
                if (validContract) {
                    const feeOnlyTx = { ...tx, txData: { ...tx.txData, redeemer_count: 0 } };
                    expect(
                        transformTransaction(feeOnlyTx, changeAddresses).cardanoSpecific?.subtype,
                    ).toBe('governance_delegation');
                }
            },
        );

        it('does not count a declared collateral return as received on success', () => {
            const tx: BlockfrostTransaction = {
                address: myAddress,
                txHash: 'deadbeef',
                txData: { ...baseTxData, valid_contract: true },
                txUtxos: {
                    hash: 'deadbeef',
                    inputs: [
                        {
                            address: otherAddress,
                            amount: [
                                {
                                    unit: 'lovelace',
                                    quantity: '1200000',
                                    decimals: 6,
                                    ticker: 'ADA',
                                    name: 'Cardano',
                                },
                            ],
                            tx_hash: 'a',
                            output_index: 0,
                            data_hash: null,
                            collateral: false,
                        },
                        {
                            address: myAddress,
                            amount: [
                                {
                                    unit: 'lovelace',
                                    quantity: '2000000',
                                    decimals: 6,
                                    ticker: 'ADA',
                                    name: 'Cardano',
                                },
                            ],
                            tx_hash: 'b',
                            output_index: 0,
                            data_hash: null,
                            collateral: true,
                        },
                        {
                            address: myAddress,
                            amount: [
                                {
                                    unit: 'lovelace',
                                    quantity: '9000000',
                                    decimals: 6,
                                    ticker: 'ADA',
                                    name: 'Cardano',
                                },
                            ],
                            tx_hash: 'reference',
                            output_index: 0,
                            data_hash: null,
                            collateral: false,
                            reference: true,
                        },
                    ],
                    outputs: [
                        {
                            address: myAddress,
                            amount: [
                                {
                                    unit: 'lovelace',
                                    quantity: '1000000',
                                    decimals: 6,
                                    ticker: 'ADA',
                                    name: 'Cardano',
                                },
                            ],
                            output_index: 0,
                            collateral: false,
                        },
                        {
                            address: myAddress,
                            amount: [
                                {
                                    unit: 'lovelace',
                                    quantity: '1700000',
                                    decimals: 6,
                                    ticker: 'ADA',
                                    name: 'Cardano',
                                },
                            ],
                            output_index: 1,
                            collateral: true,
                        },
                    ],
                },
            };
            for (const result of [
                transformTransaction(tx, myAddress),
                createTransactionTransformer(myAddress)(tx),
            ]) {
                expect(result.type).toBe('recv');
                expect(result.amount).toBe('1000000');
                expect(result.details.totalInput).toBe('1200000');
                expect(result.details.totalOutput).toBe('1000000');
                expect(result.targets).toHaveLength(1);
                expect(result.cardanoSpecific?.subtype).toBeUndefined();
            }
        });

        it('does not label a failed script without a return as governance delegation', () => {
            const tx: BlockfrostTransaction = {
                address: myAddress,
                txHash: 'deadbeef',
                txData: {
                    ...baseTxData,
                    output_amount: [
                        {
                            unit: 'lovelace',
                            quantity: '0',
                            decimals: 6,
                            ticker: 'ADA',
                            name: 'Cardano',
                        },
                    ],
                    fees: '2000000',
                    valid_contract: false,
                },
                txUtxos: {
                    hash: 'deadbeef',
                    inputs: [
                        {
                            address: myAddress,
                            amount: [
                                {
                                    unit: 'lovelace',
                                    quantity: '2000000',
                                    decimals: 6,
                                    ticker: 'ADA',
                                    name: 'Cardano',
                                },
                            ],
                            tx_hash: 'a',
                            output_index: 0,
                            data_hash: null,
                            collateral: false,
                        },
                    ],
                    outputs: [],
                },
            };
            for (const result of [
                transformTransaction(tx, myAddress),
                createTransactionTransformer(myAddress)(tx),
            ]) {
                expect(result.type).toBe('sent');
                expect(result.amount).toBe('0');
                expect(result.fee).toBe('2000000');
                expect(result.details.totalInput).toBe('2000000');
                expect(result.details.totalOutput).toBe('0');
                expect(result.targets).toEqual([]);
                expect(result.cardanoSpecific?.subtype).toBeUndefined();
            }
        });
    });
});
