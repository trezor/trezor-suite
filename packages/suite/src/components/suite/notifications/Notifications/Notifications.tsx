import { useState } from 'react';

import { Icon, Tabs, Row, Divider } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { useSelector } from 'src/hooks/suite';
import { Translation } from 'src/components/suite';
import { SETTINGS } from 'src/config/suite';

import { NotificationGroup } from './NotificationGroup/NotificationGroup';

interface NotificationsProps {
    onCancel?: () => void;
}

export const Notifications = (props: NotificationsProps) => {
    const notifications = useSelector(state => state.notifications);
    const [selectedTab, setSelectedTab] = useState<'important' | 'all'>('important');

    // get important notifications
    const importantNotifications = notifications.filter(notification =>
        SETTINGS.IMPORTANT_NOTIFICATION_TYPES.includes(notification.type),
    );

    const onCancel = () => {
        if (props.onCancel) {
            props.onCancel();
        }
    };

    return (
        <>
            <Row justifyContent="space-between">
                <Tabs activeItemId={selectedTab} hasBorder={false}>
                    <Tabs.Item id="important" onClick={() => setSelectedTab('important')}>
                        <Translation id="NOTIFICATIONS_IMPORTANT_TITLE" />
                    </Tabs.Item>
                    <Tabs.Item id="all" onClick={() => setSelectedTab('all')}>
                        <Translation id="NOTIFICATIONS_ALL_TITLE" />
                    </Tabs.Item>
                </Tabs>
                {props.onCancel && (
                    <Icon
                        name="close"
                        variant="tertiary"
                        size="medium"
                        onClick={onCancel}
                        cursorPointer
                    />
                )}
            </Row>
            <Divider margin={{ top: 0, bottom: spacings.md }} />
            <NotificationGroup
                notifications={selectedTab === 'important' ? importantNotifications : notifications}
            />
        </>
    );
};
