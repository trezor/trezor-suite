import fixtures from './__fixtures__/blockfrost';
import {
    parseAsset,
    transformAccountInfo,
    transformInputOutput,
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

    describe('transformAccountInfo', () => {
        fixtures.transformAccountInfo.forEach(f => {
            it(f.description, () => {
                // @ts-expect-error incorrect params
                expect(transformAccountInfo(f.data)).toEqual(f.result);
            });
        });
    });

    // trezor-suite backlog: a script-failure transaction's collateral input was unconditionally
    // summed together with the account's regular (non-collateral) input for the same address,
    // inflating totalInput and able to flip a receive into a false "sent" with a wrong amount.
    describe('transformTransaction — collateral handling (valid_contract)', () => {
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
            output_amount: [{ unit: 'lovelace', quantity: '10000000' }],
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

        it("does not double-count a script-failure tx's collateral alongside its regular declared input for the same address", () => {
            const result = transformTransaction(
                {
                    address: myAddress,
                    txData: { ...baseTxData, valid_contract: false },
                    txUtxos: {
                        hash: 'deadbeef',
                        inputs: [
                            {
                                address: myAddress,
                                amount: [{ unit: 'lovelace', quantity: '5000000' }],
                                tx_hash: 'a',
                                output_index: 0,
                                data_hash: null,
                                collateral: false,
                            },
                            {
                                address: myAddress,
                                amount: [{ unit: 'lovelace', quantity: '2000000' }],
                                tx_hash: 'b',
                                output_index: 0,
                                data_hash: null,
                                collateral: true,
                            },
                        ],
                        outputs: [
                            {
                                address: otherAddress,
                                amount: [{ unit: 'lovelace', quantity: '1800000' }],
                                output_index: 0,
                            },
                        ],
                    },
                    // @ts-expect-error incorrect params
                },
                { change: [], used: [{ address: myAddress, path: '', transfers: 0 }], unused: [] },
            );

            // only the collateral input (2,000,000) was actually spent on script-validation
            // failure — the 5,000,000 regular declared input never took effect and must not
            // be summed in.
            expect(result.details.totalInput).toBe('2000000');
        });

        it("excludes a successful tx's collateral input entirely, since it was never spent", () => {
            const result = transformTransaction(
                {
                    address: myAddress,
                    txData: { ...baseTxData, valid_contract: true },
                    txUtxos: {
                        hash: 'deadbeef',
                        inputs: [
                            {
                                address: myAddress,
                                amount: [{ unit: 'lovelace', quantity: '5000000' }],
                                tx_hash: 'a',
                                output_index: 0,
                                data_hash: null,
                                collateral: false,
                            },
                            {
                                address: myAddress,
                                amount: [{ unit: 'lovelace', quantity: '2000000' }],
                                tx_hash: 'b',
                                output_index: 0,
                                data_hash: null,
                                collateral: true,
                            },
                        ],
                        outputs: [
                            {
                                address: otherAddress,
                                amount: [{ unit: 'lovelace', quantity: '4800000' }],
                                output_index: 0,
                            },
                        ],
                    },
                    // @ts-expect-error incorrect params
                },
                { change: [], used: [{ address: myAddress, path: '', transfers: 0 }], unused: [] },
            );

            // the collateral input (2,000,000) was never spent on success — only the regular
            // 5,000,000 input represents a real spend.
            expect(result.details.totalInput).toBe('5000000');
        });
    });
});
