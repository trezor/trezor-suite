import * as utils from '../transactionUtils';
import * as fixtures from '../__fixtures__/transactionUtils';

describe('transaction utils', () => {
    it('parseKey', () => {
        expect(utils.parseKey('2019-10-05')).toEqual(new Date(2019, 9, 5));
    });

    it('groupTransactionsByDate', () => {
        expect(
            utils.groupTransactionsByDate([
                global.JestMocks.getWalletTransaction({ blockTime: 1565792979 }),
                global.JestMocks.getWalletTransaction({ blockTime: 1565792379 }),
                global.JestMocks.getWalletTransaction({ blockTime: 1570147200 }),
                global.JestMocks.getWalletTransaction({ blockTime: 1570127200 }),
                global.JestMocks.getWalletTransaction({ blockTime: 0 }),
                global.JestMocks.getWalletTransaction({ blockTime: undefined }),
                global.JestMocks.getWalletTransaction({ blockHeight: undefined }),
                global.JestMocks.getWalletTransaction({ blockHeight: undefined, blockTime: 0 }),
            ]),
        ).toEqual({
            '2019-8-14': [
                global.JestMocks.getWalletTransaction({ blockTime: 1565792979 }),
                global.JestMocks.getWalletTransaction({ blockTime: 1565792379 }),
            ],
            '2019-10-4': [global.JestMocks.getWalletTransaction({ blockTime: 1570147200 })],
            '2019-10-3': [global.JestMocks.getWalletTransaction({ blockTime: 1570127200 })],
            pending: [
                global.JestMocks.getWalletTransaction({ blockTime: 0 }),
                global.JestMocks.getWalletTransaction({ blockTime: undefined }),
                global.JestMocks.getWalletTransaction({ blockHeight: undefined }),
                global.JestMocks.getWalletTransaction({ blockHeight: undefined, blockTime: 0 }),
            ],
        });
    });

    fixtures.analyzeTransactions.forEach(f => {
        it(`analyzeTransactions: ${f.description}`, () => {
            expect(utils.analyzeTransactions(f.fresh as any, f.known as any)).toEqual(f.result);
        });
    });
});
