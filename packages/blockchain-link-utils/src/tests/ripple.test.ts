import type { AccountTxTransaction } from 'xrpl';

import { extractAccountBalanceDiff } from '../ripple';

describe('ripple/utils', () => {
    describe('extractAccountBalanceDiff', () => {
        it('extracts modified account root balances', () => {
            const meta: AccountTxTransaction['meta'] = {
                AffectedNodes: [
                    {
                        ModifiedNode: {
                            LedgerEntryType: 'AccountRoot',
                            LedgerIndex: 'abc',
                            FinalFields: {
                                Account: 'rTest',
                                Balance: '20000000',
                            },
                            PreviousFields: {
                                Balance: '14281876',
                            },
                        },
                    },
                ],
                TransactionIndex: 0,
                TransactionResult: 'tesSUCCESS',
            };

            const result = extractAccountBalanceDiff(meta, 'rTest');

            expect(result?.preBalance.toFixed(0)).toEqual('14281876');
            expect(result?.postBalance.toFixed(0)).toEqual('20000000');
        });

        it('extracts created account root balances', () => {
            const meta: AccountTxTransaction['meta'] = {
                AffectedNodes: [
                    {
                        CreatedNode: {
                            LedgerEntryType: 'AccountRoot',
                            LedgerIndex: 'abc',
                            NewFields: {
                                Account: 'rCreated',
                                Balance: '25718124',
                            },
                        },
                    },
                ],
                TransactionIndex: 0,
                TransactionResult: 'tesSUCCESS',
            };

            const result = extractAccountBalanceDiff(meta, 'rCreated');

            expect(result?.preBalance.toFixed(0)).toEqual('0');
            expect(result?.postBalance.toFixed(0)).toEqual('25718124');
        });

        it('returns null when the descriptor account root is not touched', () => {
            const meta: AccountTxTransaction['meta'] = {
                AffectedNodes: [
                    {
                        ModifiedNode: {
                            LedgerEntryType: 'AccountRoot',
                            LedgerIndex: 'abc',
                            FinalFields: {
                                Account: 'rOther',
                                Balance: '20000000',
                            },
                            PreviousFields: {
                                Balance: '14281876',
                            },
                        },
                    },
                ],
                TransactionIndex: 0,
                TransactionResult: 'tesSUCCESS',
            };

            expect(extractAccountBalanceDiff(meta, 'rMissing')).toBeNull();
        });
    });
});
