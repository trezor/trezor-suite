import * as utils from '../transactionUtils';
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
            // @ts-ignore
            expect(utils.enhanceTransaction(f.tx, f.account)).toEqual(f.result);
        });
    });

    const transactions = stMock.transactions as WalletAccountTransaction[];
    const metadata = stMock.metadata as AccountMetadata;
    fixtures.searchTransactions.forEach(f => {
        it(`searchTransactions - ${f.description}`, () => {
            const search = utils.searchTransactions(transactions, metadata, f.search);

            if (f.result) {
                expect(search.length).toBe(f.result.length);
                search.forEach((t, i) => {
                    expect(t.txid).toBe(f.result[i]);
                });
            } else if (f.notResult) {
                search.forEach((t, i) => {
                    expect(t.txid).not.toBe(f.notResult[i]);
                });
            }
        });
    });
});
