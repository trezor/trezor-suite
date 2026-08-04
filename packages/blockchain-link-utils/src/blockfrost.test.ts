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

        // A user-selectable (untrusted) blockfrost backend can return a GET_ACCOUNT_UTXO
        // response with one record whose `utxoData.amount` (TS-required array) is omitted.
        // `utxoData.amount.forEach(...)` throws on such a record, which used to abort the whole
        // transformUtxos call → all UTXOs fail to load (coin control / send-form breaks) — a
        // poison-one-record DoS. Verify the bad UTXO is dropped and the valid ones survive.
        it('drops a poison UTXO record with missing `utxoData.amount` instead of throwing', () => {
            const validUtxo = {
                address: 'addr1qywvux9d5u4cqyzrhp587sty33gt5pl5hpxmnzrw5nk5j87fdzm3eywgf7',
                path: 'path',
                utxoData: {
                    tx_hash: '28172ea876c3d1e691284e5179fae2feb3e69d7d41e43f8023dc380115741026',
                    amount: [{ unit: 'lovelace', quantity: '1000000' }],
                    output_index: 1,
                    tx_index: 1,
                    block: '5c571f83fe6c784d3fbc223792627ccf0eea96773100f9aedecf8b1eda4544d7',
                },
                blockInfo: { confirmations: 100, height: 101 },
            };
            const poisonUtxo = {
                address: 'addr1qywvux9d5u4cqyzrhp587sty33gt5pl5hpxmnzrw5nk5j87fdzm3eywgf7',
                path: 'path2',
                // `utxoData.amount` omitted on purpose (untrusted backend)
                utxoData: {
                    tx_hash: '28172ea876c3d1e691284e5179fae2feb3e69d7d41e43f8023dc380115741026',
                    output_index: 2,
                    tx_index: 1,
                    block: '5c571f83fe6c784d3fbc223792627ccf0eea96773100f9aedecf8b1eda4544d7',
                },
                blockInfo: { confirmations: 0, height: undefined },
            };

            let result;
            expect(() => {
                // @ts-expect-error poisonUtxo intentionally omits the TS-required amount
                result = transformUtxos([poisonUtxo, validUtxo]);
            }).not.toThrow();

            expect(result).toHaveLength(1);
            expect(result?.[0]).toMatchObject({ path: 'path', amount: '1000000' });
        });

        it('returns an empty array when the whole utxos payload is not an array', () => {
            // @ts-expect-error non-array payload from an untrusted backend
            expect(transformUtxos(undefined)).toEqual([]);
            // @ts-expect-error non-array payload from an untrusted backend
            expect(transformUtxos({})).toEqual([]);
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

        // A user-selectable (untrusted) blockfrost backend can return an account-info response
        // whose `tokens` list contains one entry with `unit` (TS-required) omitted. transformToken
        // → parseAsset(token.unit).slice() throws on such a record, which used to abort the whole
        // transformTokenInfo (and therefore transformAccountInfo) → per-account DoS. Verify the bad
        // token is dropped and the valid ones survive.
        it('drops a poison token record with missing `unit` instead of throwing', () => {
            const validToken = {
                unit: '279c909f348e533da5808898f87f9a14bb2c3dfbbacccd631d927a3f534e454b',
                quantity: '4',
                decimals: 0,
                fingerprint: 'asset108xu02ckwrfc8qs9d97mgyh4kn8gdu9w8f5sxk',
                ticker: 'SNEK',
                name: 'Snek',
            };
            const poisonToken = {
                // `unit` omitted on purpose (untrusted backend), the rest is well-formed
                quantity: '1',
                decimals: 0,
                fingerprint: 'asset1zvclg2cvj4e5jfz5vswf3sx0lasy79xn8cdap9',
                ticker: 'GRIC',
                name: null,
            };

            let result;
            expect(() => {
                // @ts-expect-error poisonToken intentionally omits the TS-required `unit`
                result = transformTokenInfo([poisonToken, validToken]);
            }).not.toThrow();

            expect(result).toHaveLength(1);
            expect(result?.[0]).toMatchObject({ symbol: 'SNEK', contract: validToken.unit });
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

        // A user-selectable (untrusted) blockfrost backend can return an otherwise-valid
        // account-info response containing a single transaction record with a field the wire
        // type marks non-optional omitted. transformTransaction unconditionally dereferences
        // those fields (here an input's `.amount` array via transformInputOutput), so one poison
        // record used to throw out of the whole-page `.map` and fail the entire history page
        // (poison-one-record DoS). Verify the bad record is dropped and valid ones survive.
        describe('poison-record DoS resistance', () => {
            const validTx = {
                address: 'addr_valid',
                txHash: 'validhash',
                txData: {
                    hash: 'validhash',
                    block: 'blk',
                    block_height: 1,
                    block_time: 1629388426,
                    slot: 1,
                    index: 0,
                    output_amount: [{ unit: 'lovelace', quantity: '100' }],
                    fees: '10',
                    deposit: '0',
                    size: 100,
                    invalid_before: null,
                    invalid_hereafter: null,
                    utxo_count: 1,
                    withdrawal_count: 0,
                    delegation_count: 0,
                    stake_cert_count: 0,
                },
                txUtxos: {
                    hash: 'validhash',
                    inputs: [
                        {
                            address: 'in_addr',
                            amount: [{ unit: 'lovelace', quantity: '110' }],
                            tx_hash: 'prev',
                            output_index: 0,
                            collateral: false,
                            data_hash: null,
                        },
                    ],
                    outputs: [
                        {
                            address: 'out_addr',
                            amount: [{ unit: 'lovelace', quantity: '100' }],
                            output_index: 0,
                            data_hash: null,
                        },
                    ],
                },
            };

            // Identical to validTx but the input omits the `.amount` array a malformed backend
            // would drop → transformInputOutput's `utxo.amount.find(...)` throws.
            const poisonTx = {
                ...validTx,
                txHash: 'poisonhash',
                txData: { ...validTx.txData, hash: 'poisonhash' },
                txUtxos: {
                    hash: 'poisonhash',
                    inputs: [
                        {
                            address: 'in_addr',
                            tx_hash: 'prev',
                            output_index: 0,
                            collateral: false,
                            data_hash: null,
                        },
                    ],
                    outputs: validTx.txUtxos.outputs,
                },
            };

            const buildInfo = (transactions: unknown[]) => ({
                descriptor: 'desc',
                empty: false,
                balance: '0',
                availableBalance: '0',
                history: { total: transactions.length, unconfirmed: 0, transactions },
                page: { index: 1, size: 25, total: transactions.length },
                misc: {
                    staking: {
                        address: 'stake',
                        rewards: '0',
                        isActive: false,
                        poolId: null,
                        drep: null,
                    },
                },
            });

            it('drops a single malformed tx instead of crashing the whole history page', () => {
                // Pre-fix this call throws out of the whole-page `.map` (test errors); post-fix the
                // poison record is dropped and the valid one survives.
                // @ts-expect-error minimal untrusted-backend shape
                const result = transformAccountInfo(buildInfo([poisonTx, validTx]));
                const txs = result.history.transactions ?? [];

                expect(txs).toHaveLength(1);
                expect(txs[0]?.txid).toBe('validhash');
            });

            it('still transforms every record when none are malformed', () => {
                // @ts-expect-error minimal untrusted-backend shape
                const result = transformAccountInfo(buildInfo([validTx, validTx]));
                expect(result.history.transactions ?? []).toHaveLength(2);
            });
        });
    });
});
