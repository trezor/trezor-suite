import React, { PureComponent } from 'react';
import styled from 'styled-components';
import { NotificationEntry } from '@wallet-reducers/notificationReducer';
import Group from './components/Group';

const Wrapper = styled.div`
    width: 100%;
`;

interface Props {
    notifications: NotificationEntry[];
    close: () => any;
}

type GroupType = 'success' | 'warning' | 'info' | 'error';

class NotificationsGroup extends PureComponent<Props> {
    groupNotifications = (notifications: NotificationEntry[]) =>
        notifications.reduce(
            (acc: { [key: string]: NotificationEntry[] }, obj: NotificationEntry) => {
                const key = obj.variant;
                if (!acc[key]) {
                    acc[key] = [];
                }
                acc[key].push({ ...obj, key: new Date().getTime().toString() }); // key was previously set as obj, but that is not a string
                return acc;
            },
            {},
        );

    sortByPriority(notifications: {
        [key: string]: NotificationEntry[];
    }): { [key: string]: NotificationEntry[] } {
        // TODO
        return notifications;
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
