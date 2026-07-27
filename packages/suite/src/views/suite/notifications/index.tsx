import { useState } from 'react';

import { DebugOnlyBadge, selectIsDebugModeActive } from '@suite/debug';
import { Translation } from '@suite/intl';
import { Card, Column, Dot, Row } from '@trezor/components';

import {
    type NavigationItem,
    PageHeader,
    SubpageNavigation,
} from 'src/components/suite/layouts/SuiteLayout';
import { NotificationGroup } from 'src/components/suite/notifications/Notifications/NotificationGroup/NotificationGroup';
import { ReleaseNotes } from 'src/components/suite/notifications/ReleaseNotes/ReleaseNotes';
import { TriggerActivityNotification } from 'src/components/suite/notifications/TriggerActivityNotification/TriggerActivityNotification';
import { useLayout, useSelector } from 'src/hooks/suite';
import { isTransactionNotification } from 'src/utils/suite/notification';

type ActivityTab = 'transactions' | 'release-notes' | 'all';

const NotificationsView = () => {
    const notifications = useSelector(state => state.notifications);
    const isDebugModeActive = useSelector(selectIsDebugModeActive);
    const [selectedTab, setSelectedTab] = useState<ActivityTab>('transactions');

    const transactionNotifications = notifications.filter(isTransactionNotification);
    const activityNotifications = notifications.filter(
        notification => !isTransactionNotification(notification),
    );
    const hasUnseenNotifications = transactionNotifications.some(
        notification => !notification.seen,
    );

    const activitySubpages: NavigationItem<ActivityTab>[] = [
        {
            id: 'transactions',
            title: (
                <Row gap={4} alignItems="center">
                    <Translation id="NOTIFICATIONS_IMPORTANT_TITLE" />
                    {hasUnseenNotifications && <Dot intent="critical" size={8} />}
                </Row>
            ),
            callback: () => setSelectedTab('transactions'),
        },
        {
            id: 'all',
            title: <Translation id="NOTIFICATIONS_SYSTEM_TITLE" />,
            callback: () => setSelectedTab('all'),
        },
        {
            id: 'release-notes',
            title: <Translation id="TR_RELEASE_NOTES" />,
            callback: () => setSelectedTab('release-notes'),
        },
    ];

    useLayout(
        'Activity',
        <>
            <PageHeader />
            <SubpageNavigation
                data-testid="@notifications/menu"
                items={activitySubpages}
                activeItemId={selectedTab}
            />
        </>,
    );

    return (
        <Column gap={16} width="100%" maxWidth={600} margin={{ horizontal: 'auto' }}>
            {isDebugModeActive && (
                <Card
                    header={
                        <Row gap={8}>
                            Debug activity
                            <DebugOnlyBadge />
                        </Row>
                    }
                >
                    <TriggerActivityNotification />
                </Card>
            )}

            {selectedTab === 'transactions' && (
                <Card>
                    <NotificationGroup notifications={transactionNotifications} />
                </Card>
            )}
            {selectedTab === 'all' && (
                <Card>
                    <NotificationGroup
                        notifications={activityNotifications}
                        emptyTitle="NOTIFICATIONS_EMPTY_ACTIVITY_TITLE"
                        emptyDescription="NOTIFICATIONS_EMPTY_ACTIVITY_DESC"
                    />
                </Card>
            )}
            {selectedTab === 'release-notes' && <ReleaseNotes />}
        </Column>
    );
};

export default NotificationsView;
