import { useState } from 'react';
import { useSelector } from 'react-redux';

import { selectHasUnseenNotifications } from '@suite-common/toast-notifications';
import { NotificationDot } from '@suite-native/activity-center';
import { type SubTabItem, SubTabs, Text, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { DynamicScreenHeader, Screen } from '@suite-native/navigation';

type ActivityCenterTab = 'notifications' | 'system' | 'releaseNotes';

export const ActivityCenterScreen = () => {
    const hasUnseenNotifications = useSelector(selectHasUnseenNotifications);
    const [activeTab, setActiveTab] = useState<ActivityCenterTab>('notifications');

    const tabs: SubTabItem<ActivityCenterTab>[] = [
        {
            value: 'notifications',
            label: <Translation id="moduleActivityCenter.tabs.notifications" />,
            accessory: hasUnseenNotifications ? <NotificationDot /> : undefined,
        },
        { value: 'system', label: <Translation id="moduleActivityCenter.tabs.system" /> },
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
            <VStack>
                <SubTabs items={tabs} value={activeTab} onChange={setActiveTab} />
                <Text>WIP: content of the tabs will be implemented in the followup.</Text>
            </VStack>
        </Screen>
    );
};
