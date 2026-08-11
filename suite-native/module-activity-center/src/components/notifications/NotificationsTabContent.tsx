import { useSelector } from 'react-redux';

import { getSeenAndUnseenNotifications } from '@suite-common/toast-notifications';
import { selectNonPhishingTransactionNotifications } from '@suite-common/wallet-core';
import { Box } from '@suite-native/atoms';

import { ActivityCenterEmptyState } from './ActivityCenterEmptyState';
import { NotificationList } from './NotificationList';

export const NotificationsTabContent = () => {
    const txNotifications = useSelector(selectNonPhishingTransactionNotifications);
    const { seenNotifications, unseenNotifications } =
        getSeenAndUnseenNotifications(txNotifications);

    if (txNotifications.length === 0) {
        return (
            <Box flex={1} justifyContent="center" alignItems="center">
                <ActivityCenterEmptyState
                    titleId="moduleActivityCenter.notifications.empty.title"
                    subtitleId="moduleActivityCenter.notifications.empty.subtitle"
                />
            </Box>
        );
    }

    return (
        <NotificationList
            unseenNotifications={unseenNotifications}
            seenNotifications={seenNotifications}
        />
    );
};
