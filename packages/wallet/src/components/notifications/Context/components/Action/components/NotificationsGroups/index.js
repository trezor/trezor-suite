import React, { PureComponent } from 'react';
import styled from 'styled-components';
import PropTypes from 'prop-types';

import Group from './components/Group';

const Wrapper = styled.div`
    width: 100%;
`;

class NotificationsGroup extends PureComponent {
    groupNotifications = notifications =>
        notifications.reduce((acc, obj) => {
            const key = obj.variant;
            if (!acc[key]) {
                acc[key] = [];
            }
            acc[key].push({ ...obj, key: obj });
            return acc;
        }, {});

    sortByPriority(notifications) {
        //TODO
        return notifications;
    }

    render() {
        const { close, notifications } = this.props;
        // const notifications = [
        //     {
        //         key: 1,
        //         title: 'this is a title of error notification',
        //         variant: 'error',
        //         message: 'this is a message of error notification',
        //     },
        //     {
        //         key: 2,
        //         title: 'this is a title of warning notification',
        //         variant: 'warning',
        //         message: 'this is a message of warning notification',
        //     },
        //     {
        //         key: 3,
        //         title: 'this is a title of warning notification',
        //         variant: 'warning',
        //         message: 'this is a message of warning notification',
        //     },
        //     {
        //         key: 4,
        //         title: 'this is a title of warning notification sds d',
        //         variant: 'warning',
        //         message: 'this is a message of warning notification',
        //     },
        //     {
        //         key: 5,
        //         title: 'this is a title of warning notification as',
        //         variant: 'success',
        //     },
        //     {
        //         key: 6,
        //         title: 'this is a title of warning notification as',
        //         variant: 'info',
        //         message: 'this is a message of warning notification',
        //     },
        //     {
        //         key: 7,
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

        return (
            <Wrapper>
                {Object.keys(sortedNotifications).map(group => (
                    <Group
                        key={group}
                        groupNotifications={notificationGroups[group]}
                        variant={group}
                        close={close}
                    />
                ))}
            </Wrapper>
        );
    }
}

NotificationsGroup.propTypes = {
    notifications: PropTypes.array.isRequired,
    close: PropTypes.func.isRequired,
};

export default NotificationsGroup;
