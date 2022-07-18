import * as utils from '@suite-common/wallet-utils';
import * as fixtures from '../__fixtures__/transactionUtils';
import stMock from '../__fixtures__/searchTransactions.json';
import { WalletAccountTransaction } from '@wallet-types';
import { AccountMetadata } from '@suite-types/metadata';

describe('transaction utils', () => {
    it('parseKey', () => {
        expect(utils.parseKey('2019-10-05')).toEqual(new Date(2019, 9, 5));
    });

    it('groupTransactionsByDate', () => {
        const groupedTxs = utils.groupTransactionsByDate([
            global.JestMocks.getWalletTransaction({ blockTime: 1565792979, blockHeight: 5 }),
            global.JestMocks.getWalletTransaction({ blockTime: 1565792379, blockHeight: 4 }),
            global.JestMocks.getWalletTransaction({ blockHeight: 0 }),
            global.JestMocks.getWalletTransaction({ blockTime: 1570147200, blockHeight: 2 }),
            global.JestMocks.getWalletTransaction({ blockTime: 1570127200, blockHeight: 3 }),
            global.JestMocks.getWalletTransaction({ blockHeight: undefined }),
        ]);
        expect(groupedTxs).toEqual({
            pending: [
                global.JestMocks.getWalletTransaction({ blockHeight: 0 }),
                global.JestMocks.getWalletTransaction({ blockHeight: undefined }),
            ],
            '2019-10-4': [
                global.JestMocks.getWalletTransaction({ blockTime: 1570147200, blockHeight: 2 }),
            ],
            '2019-10-3': [
                global.JestMocks.getWalletTransaction({ blockTime: 1570127200, blockHeight: 3 }),
            ],
            '2019-8-14': [
                global.JestMocks.getWalletTransaction({ blockTime: 1565792979, blockHeight: 5 }),
                global.JestMocks.getWalletTransaction({ blockTime: 1565792379, blockHeight: 4 }),
            ],
        });
    });

    fixtures.analyzeTransactions.forEach(f => {
        it(`analyzeTransactions: ${f.description}`, () => {
            expect(utils.analyzeTransactions(f.fresh as any, f.known as any)).toEqual(f.result);
        });
    });

    fixtures.enhanceTransaction.forEach(f => {
        it('enhanceTransaction', () => {
            expect(utils.enhanceTransaction(f.tx as any, f.account)).toEqual(f.result);
        });
    });

    fixtures.getRbfParams.forEach(f => {
        it(`getRbfParams: ${f.description}`, () => {
            expect(utils.getRbfParams(f.tx as any, f.account as any)).toEqual(f.result);
        });
    });

    fixtures.findChainedTransactions.forEach(f => {
        it(`findChainedTransactions: ${f.description}`, () => {
            expect(utils.findChainedTransactions(f.txid, f.transactions as any)).toEqual(f.result);
        });
    });

    const transactions = stMock.transactions as WalletAccountTransaction[];
    const metadata = stMock.metadata as AccountMetadata;
    fixtures.searchTransactions.forEach(f => {
        it(`searchTransactions - ${f.description}`, () => {
            const search = utils.advancedSearchTransactions(transactions, metadata, f.search);

            if (f.result) {
                // expect(search.length).toBe(f.result.length);
                search.forEach((t, i) => {
                    expect(t.txid).toBe(f.result[i]);
                });
            }

            if (f.notResult) {
                search.forEach((t, i) => {
                    expect(t.txid).not.toBe(f.notResult[i]);
                });
            }
        });
    });

    fixtures.getAccountTransactions.forEach(f => {
        it(`getAccountTransactions${f.testName}`, () => {
            expect(utils.getAccountTransactions(f.account.key, f.transactions as any)).toEqual(
                f.result,
            );
        });
    });
});
