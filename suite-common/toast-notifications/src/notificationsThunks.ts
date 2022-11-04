import { createThunk } from '@suite-common/redux-utils';

import { ACTION_PREFIX, notificationsActions } from './notificationsActions';
import { selectNotifications } from './notificationsSelectors';
import { NotificationEntry } from './types';

const findTransactionEvents = (descriptor: string, notifications: NotificationEntry[]) =>
    notifications.filter(
        n =>
            (n.type === 'tx-sent' || n.type === 'tx-received' || n.type === 'tx-confirmed') &&
            (n.descriptor === descriptor || n.txid === descriptor),
    );

export const removeTransactionEventsThunk = createThunk(
    `${ACTION_PREFIX}/removeTransactionEventsThunk`,
    (txs: { txid: string }[], { dispatch, getState }) => {
        txs.forEach(tx => {
            const entries = findTransactionEvents(tx.txid, selectNotifications(getState()));
            if (entries.length > 0) dispatch(notificationsActions.remove(entries));
        });
    },
);

export const removeAccountEventsThunk = createThunk(
    `${ACTION_PREFIX}/removeAccountEventsThunk`,
    (descriptor: string, { dispatch, getState }) => {
        const entries = findTransactionEvents(descriptor, selectNotifications(getState()));
        if (entries.length > 0) dispatch(notificationsActions.remove(entries));
    },
);
