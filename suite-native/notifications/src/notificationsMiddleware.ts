import * as Notifications from 'expo-notifications';

import { createMiddleware } from '@suite-common/redux-utils';
import { notificationsActions } from '@suite-common/toast-notifications';

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
    }),
});

const requestPermissionsIfNeeded = async () => {
    const { status } = await Notifications.getPermissionsAsync();
    console.log('TCL: requestPermissionsIfNeeded -> status', status);
    if (status === 'granted') return true;
    if (status !== 'granted') {
        const { status: newStatus } = await Notifications.requestPermissionsAsync();

        return newStatus === 'granted';
    }

    return false;
};

requestPermissionsIfNeeded();

const TX_NOTIFICATION_CONTENT: Record<
    'tx-received' | 'tx-confirmed',
    { title: string; bodyPrefix: string }
> = {
    'tx-received': { title: 'Incoming transaction', bodyPrefix: 'You received' },
    'tx-confirmed': { title: 'Transaction confirmed', bodyPrefix: 'Confirmed' },
};

export const notificationsMiddleware = createMiddleware((action, { next }) => {
    next(action);

    if (notificationsActions.addEvent.match(action)) {
        const { type } = action.payload;
        if (type !== 'tx-received' && type !== 'tx-confirmed') return action;

        const { formattedAmount, symbol, token } = action.payload;
        const assetName = token ? token.symbol.toUpperCase() : symbol.toUpperCase();
        const { title, bodyPrefix } = TX_NOTIFICATION_CONTENT[type];

        // Notifications.scheduleNotificationAsync({
        //     content: {
        //         title,
        //         body: `${bodyPrefix} ${formattedAmount} ${assetName}`,
        //     },
        //     trigger: null,
        // });
    }

    return action;
});
