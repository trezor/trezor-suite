import { asNetworkSymbol } from '@suite-common/wallet-config';

import {
    selectEarnTransactionNotifications,
    selectIsEarnTransactionConfirmationNotified,
} from './notificationsSelectors';
import { type NotificationEntry } from './types';

const transaction = {
    descriptor: 'descriptor',
    symbol: asNetworkSymbol('eth'),
    txid: 'tx1',
};

const toRootState = (notifications: NotificationEntry[]) => ({ notifications });

describe('selectEarnTransactionNotifications', () => {
    it('returns every stage of the earn transaction of the account only', () => {
        const pending: NotificationEntry = {
            context: 'toast',
            id: 1,
            type: 'tx-staked',
            stage: 'pending',
            ...transaction,
        };
        const spedUp: NotificationEntry = {
            context: 'toast',
            id: 2,
            type: 'tx-staked',
            stage: 'sped-up',
            ...transaction,
        };
        const state = toRootState([
            spedUp,
            { context: 'toast', id: 3, type: 'tx-sent', amount: '1', ...transaction },
            { context: 'event', id: 4, type: 'tx-confirmed', amount: '1', ...transaction },
            {
                context: 'toast',
                id: 5,
                type: 'tx-staked',
                stage: 'pending',
                ...transaction,
                txid: 'tx2',
            },
            {
                context: 'toast',
                id: 6,
                type: 'tx-staked',
                stage: 'pending',
                ...transaction,
                descriptor: 'other',
            },
            pending,
        ]);

        expect(selectEarnTransactionNotifications(state, transaction)).toEqual([spedUp, pending]);
    });
});

describe('selectIsEarnTransactionConfirmationNotified', () => {
    it('is true once an earn confirmed toast exists for the transaction of the account', () => {
        const state = toRootState([
            { context: 'toast', id: 1, type: 'tx-staked', stage: 'confirmed', ...transaction },
        ]);

        expect(selectIsEarnTransactionConfirmationNotified(state, transaction)).toBe(true);
        expect(
            selectIsEarnTransactionConfirmationNotified(state, { ...transaction, txid: 'tx2' }),
        ).toBe(false);
        expect(
            selectIsEarnTransactionConfirmationNotified(state, {
                ...transaction,
                descriptor: 'other',
            }),
        ).toBe(false);
    });

    it('ignores the generic confirmed event and earlier stages of the same transaction', () => {
        const state = toRootState([
            { context: 'event', id: 1, type: 'tx-confirmed', amount: '1', ...transaction },
            { context: 'toast', id: 2, type: 'tx-staked', stage: 'pending', ...transaction },
            { context: 'toast', id: 3, type: 'tx-staked', stage: 'sped-up', ...transaction },
        ]);

        expect(selectIsEarnTransactionConfirmationNotified(state, transaction)).toBe(false);
    });
});
