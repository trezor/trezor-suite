import React, { PureComponent } from 'react';
import styled from 'styled-components';
import { NotificationEntry } from '@suite-reducers/notificationReducer';
import { close } from '@suite-actions/notificationActions';
import NOTIFICATIONS_CONSTANTS from '@wallet-constants/notification';
import Group from './components/Group';

const Wrapper = styled.div`
    width: 100%;
`;

interface Props {
    notifications: NotificationEntry[];
    close: typeof close;
}

type GroupType = NotificationEntry['variant'];
interface GroupedNotifications {
    [key: string]: NotificationEntry[];
}

class NotificationsGroup extends PureComponent<Props> {
    groupNotifications = (notifications: NotificationEntry[]) => {
        return notifications.reduce((acc: GroupedNotifications, obj: NotificationEntry) => {
            const key = obj.variant;
            if (!acc[key]) {
                acc[key] = [];
            }
            acc[key].push({ ...obj });
            return acc;
        }, {});
    };

    sortByPriority(notifications: GroupedNotifications): GroupedNotifications {
        const sortedGroups = Object.keys(NOTIFICATIONS_CONSTANTS.PRIORITY).sort(
            (group1, group2) =>
                NOTIFICATIONS_CONSTANTS.PRIORITY[group1 as GroupType] -
                NOTIFICATIONS_CONSTANTS.PRIORITY[group2 as GroupType],
        );

        const sortedNotifications: GroupedNotifications = {};
        sortedGroups.forEach(key => {
            if (key in notifications) {
                sortedNotifications[key] = notifications[key];
            }
        });

        return sortedNotifications;
    }

    render() {
        const { close, notifications } = this.props;
        // const notifications = [
        //     {
        //         key: '1',
        //         title: 'this is a title of error notification',
        //         variant: 'error',
        //         message: 'this is a message of error notification',
        //     },
        //     {
        //         key: '2',
        //         title: 'this is a title of warning notification',
        //         variant: 'warning',
        //         message: 'this is a message of warning notification',
        //     },
        //     {
        //         key: '3',
        //         title: 'this is a title of warning notification',
        //         variant: 'warning',
        //         message: 'this is a message of warning notification',
        //     },
        //     {
        //         key: '4',
        //         title: 'this is a title of warning notification sds d',
        //         variant: 'warning',
        //         message: 'this is a message of warning notification',
        //     },
        //     {
        //         key: '5',
        //         title: 'this is a title of warning notification as',
        //         variant: 'success',
        //     },
        //     {
        //         key: '6',
        //         title: 'this is a title of warning notification as',
        //         variant: 'info',
        //         message: 'this is a message of warning notification',
        //     },
        //     {
        //         key: '7',
        //         title: 'this is a title of info notification s ',
        //         variant: 'info',
        //         message: 'this is a message of info notification',
        //         actions: [
        //             {
        //                 label: 'Update',
        //                 callback: 'props.routerActions.gotoBridgeUpdate',
        //             },
        //         ],
        //     },
        // ];
        const notificationGroups = this.groupNotifications(notifications);
        const sortedNotifications = this.sortByPriority(notificationGroups);

        // TODO TS types
        return (
            <Wrapper>
                {Object.keys(sortedNotifications).map(group => (
                    <Group
                        key={group}
                        groupNotifications={sortedNotifications[group]}
                        variant={group as GroupType}
                        close={close}
                    />
                ))}
            </Wrapper>
        );
    }
}

export default NotificationsGroup;
