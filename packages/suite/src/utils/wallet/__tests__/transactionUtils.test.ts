import * as utils from '../transactionUtils';

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
            ]),
        ).toEqual({
            '2019-8-14': [
                global.JestMocks.getWalletTransaction({ blockTime: 1565792979 }),
                global.JestMocks.getWalletTransaction({ blockTime: 1565792379 }),
            ],
            '2019-10-4': [global.JestMocks.getWalletTransaction({ blockTime: 1570147200 })],
            '2019-10-3': [global.JestMocks.getWalletTransaction({ blockTime: 1570127200 })],
        });
    });
});
