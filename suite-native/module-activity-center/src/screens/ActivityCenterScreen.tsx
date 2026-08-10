import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import {
    notificationsActions,
    selectHasUnseenTransactionNotifications,
} from '@suite-common/toast-notifications';
import { NotificationDot } from '@suite-native/activity-center';
import { Box, type SubTabItem, SubTabs, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { DynamicScreenHeader, Screen } from '@suite-native/navigation';

import { ActivityCenterTabContent } from '../components/ActivityCenterTabContent';

type ActivityCenterTab = 'notifications' | 'system' | 'releaseNotes';

export const ActivityCenterScreen = () => {
    const dispatch = useDispatch();
    const hasUnseenNotifications = useSelector(selectHasUnseenTransactionNotifications);
    const [activeTab, setActiveTab] = useState<ActivityCenterTab>('notifications');

    useEffect(
        () => () => {
            // Mark all the notifications as seen on leaving the activity center.
            dispatch(notificationsActions.resetUnseen());
        },
        [dispatch],
    );

    const tabs: SubTabItem<ActivityCenterTab>[] = [
        {
            value: 'notifications',
            label: <Translation id="moduleActivityCenter.tabs.notifications" />,
            accessory: hasUnseenNotifications ? <NotificationDot /> : undefined,
        },
        {
            value: 'releaseNotes',
            label: <Translation id="moduleActivityCenter.tabs.releaseNotes" />,
        },
    ];

    return (
        <Screen
            header={
                <DynamicScreenHeader
                    title={<Translation id="moduleActivityCenter.title" />}
                    marginBottom="sp16"
                />
            }
        >
            <VStack flex={1}>
                <Box>
                    <SubTabs items={tabs} value={activeTab} onChange={setActiveTab} />
                </Box>
                <Box flex={1}>
                    <ActivityCenterTabContent activeTab={activeTab} />
                </Box>
            </VStack>
        </Screen>
    );
};
