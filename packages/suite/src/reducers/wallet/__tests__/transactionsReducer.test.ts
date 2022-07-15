import { STORAGE } from '../../../actions/suite/constants';
import { ACCOUNT, TRANSACTION } from '../../../actions/wallet/constants';
import reducer, { initialState } from '../transactionReducer';
import * as transactionActions from '../transactionActions';

const { getWalletTransaction } = global.JestMocks;

describe('transactions reducer', () => {
    // it('ACCOUNT.REMOVE action', () => {
    //     expect(
    //         reducer(undefined, {
    //             type: ACCOUNT.REMOVE,
    //             payload: [{ key: 'account1' }, { key: 'account2' }],
    //         }),
    //     ).toEqual(initialState);
    // });

    it('TRANSACTION.ADD action', () => {
        const account = global.JestMocks.getWalletAccount();

        expect(
            reducer(undefined, {
                type: TRANSACTION.ADD,
                transactions: [getWalletTransaction()],
                account,
            }),
        ).toMatchSnapshot();
    });

    it('TRANSACTION.REMOVE action', () => {
        const account1 = global.JestMocks.getWalletAccount({ descriptor: 'xpub1' });
        const account2 = global.JestMocks.getWalletAccount({ descriptor: 'xpub2' });
        const transaction1 = global.JestMocks.getWalletTransaction({
            blockTime: 1565792979,
            blockHeight: 5,
        });
        const transaction2 = global.JestMocks.getWalletTransaction({
            blockTime: 1565792379,
            blockHeight: 4,
        });

        const stateWithTransactions1 = reducer(undefined, {
            type: TRANSACTION.ADD,
            transactions: [transaction1],
            account: account1,
        });
        const stateWithTransactions2 = reducer(stateWithTransactions1, {
            type: TRANSACTION.ADD,
            transactions: [transaction1, transaction2],
            account: account2,
        });

        console.log(stateWithTransactions2.transactions[account2.key]);

        const stateWithRemovedTransaction = reducer(stateWithTransactions2, {
            type: TRANSACTION.REMOVE,
            txs: [transaction2],
            account: account2,
        });

        console.log(stateWithRemovedTransaction.transactions[account2.key]);

        expect(stateWithRemovedTransaction.transactions[account2.key].length).toBe(1);
        expect(stateWithRemovedTransaction.transactions[account1.key].length).toBe(1);
    });
});
