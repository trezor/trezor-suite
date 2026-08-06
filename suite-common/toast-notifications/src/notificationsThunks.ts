import { createThunk } from '@suite-common/redux-utils';

import { ACTION_PREFIX, notificationsActions } from './notificationsActions';
import { selectNotifications } from './notificationsSelectors';
import { isTransactionNotification } from './notificationsUtils';
import { type NotificationEntry, type NotificationsRootState } from './types';

type TransactionEntry = NotificationEntry & { descriptor?: string; txid?: string };

const findTransactionEvents = (descriptor: string, notifications: NotificationEntry[]) =>
    notifications
        .filter((n): n is TransactionEntry => isTransactionNotification(n))
        .filter(n => n.descriptor === descriptor || n.txid === descriptor);

type RemoveAccountEventsThunkState = NotificationsRootState;

export const removeAccountEventsThunk = createThunk<
    void,
    string,
    { state: RemoveAccountEventsThunkState }
>(`${ACTION_PREFIX}/removeAccountEventsThunk`, (descriptor, { dispatch, getState }) => {
    const entries = findTransactionEvents(descriptor, selectNotifications(getState()));
    if (entries.length > 0) dispatch(notificationsActions.remove(entries));
});
