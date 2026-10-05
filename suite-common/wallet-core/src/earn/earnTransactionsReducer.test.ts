import { asNetworkSymbol } from '@suite-common/wallet-config';
import { asAccountDescriptor } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';

import {
    type EarnTransactionsState,
    earnTransactionsActions,
    earnTransactionsReducer,
    selectTrackedEarnTransaction,
} from './earnTransactionsReducer';
import { accountsActions } from '../accounts/accountsActions';

const account = mockWalletAccount({
    symbol: asNetworkSymbol('eth'),
    deviceState: '1@2:3',
    descriptor: asAccountDescriptor('accA'),
});
const otherAccount = mockWalletAccount({
    symbol: asNetworkSymbol('eth'),
    deviceState: '1@2:3',
    descriptor: asAccountDescriptor('accB'),
});

const toRootState = (earnTransactions: EarnTransactionsState) => ({
    wallet: { earnTransactions },
});

describe('earnTransactionsReducer', () => {
    it('tracks a broadcast earn transaction under its account', () => {
        const state = earnTransactionsReducer(
            {},
            earnTransactionsActions.trackEarnTransaction({
                accountKey: account.key,
                txid: 'tx1',
                flow: 'stake',
            }),
        );

        expect(selectTrackedEarnTransaction(toRootState(state), account.key, 'tx1')).toEqual({
            flow: 'stake',
        });
        expect(
            selectTrackedEarnTransaction(toRootState(state), account.key, 'tx2'),
        ).toBeUndefined();
        expect(
            selectTrackedEarnTransaction(toRootState(state), otherAccount.key, 'tx1'),
        ).toBeUndefined();
    });

    it('keeps other tracked transactions of the account when one is untracked', () => {
        let state = earnTransactionsReducer(
            {},
            earnTransactionsActions.trackEarnTransaction({
                accountKey: account.key,
                txid: 'tx1',
                flow: 'stake',
            }),
        );
        state = earnTransactionsReducer(
            state,
            earnTransactionsActions.trackEarnTransaction({
                accountKey: account.key,
                txid: 'tx2',
                flow: 'claim',
            }),
        );

        state = earnTransactionsReducer(
            state,
            earnTransactionsActions.untrackEarnTransaction({
                accountKey: account.key,
                txid: 'tx1',
            }),
        );

        expect(state).toEqual({ [account.key]: { tx2: { flow: 'claim' } } });
    });

    it('drops the account entry once its last transaction is untracked', () => {
        const state = earnTransactionsReducer(
            { [account.key]: { tx1: { flow: 'unstake' } } },
            earnTransactionsActions.untrackEarnTransaction({
                accountKey: account.key,
                txid: 'tx1',
            }),
        );

        expect(state).toEqual({});
    });

    it('ignores untracking of an unknown transaction', () => {
        const initial = { [account.key]: { tx1: { flow: 'unstake' as const } } };

        const state = earnTransactionsReducer(
            initial,
            earnTransactionsActions.untrackEarnTransaction({
                accountKey: account.key,
                txid: 'nope',
            }),
        );

        expect(state).toEqual(initial);
    });

    it('forgets the transactions of a removed account only', () => {
        const state = earnTransactionsReducer(
            {
                [account.key]: { tx1: { flow: 'stake' } },
                [otherAccount.key]: { tx2: { flow: 'claim' } },
            },
            accountsActions.removeAccount([account]),
        );

        expect(state).toEqual({ [otherAccount.key]: { tx2: { flow: 'claim' } } });
    });
});
