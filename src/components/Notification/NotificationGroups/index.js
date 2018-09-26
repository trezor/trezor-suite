import React, { Component } from 'react';
import styled from 'styled-components';

import { PRIORITY } from 'constants/notifications';
import Group from './components/Group';

const Wrapper = styled.div``;

class NotificationsGroup extends Component {
    constructor() {
        super();
        this.notifications = [
            { type: 'warning', title: 'adddaa', message: 'aaaa' },
            { type: 'error', title: 'aaddda', message: 'aaaa' },
            { type: 'info', title: 'aafffa', message: 'aaaa' },
            { type: 'error', title: 'aggaa', message: 'aaaa' },
            { type: 'warning', title: 'aasssa', message: 'aaaa' },
            { type: 'success', title: 'afaa', message: 'aaaa' },
            { type: 'error', title: 'aada', message: 'aaaa' },
            { type: 'error', title: 'aafffa', message: 'aaaa' },
        ];
    }

    groupNotifications = notifications => notifications
        .reduce((acc, obj) => {
            const key = obj.type;
            if (!acc[key]) {
                acc[key] = [];
            }
            acc[key].push(obj);
            return acc;
        }, {});

    sortByPriority(notifications) {
        return notifications;
    }

    render() {
        const { notifications } = this;
        const notificationGroups = this.groupNotifications(notifications);
        const sortedNotifications = this.sortByPriority(notificationGroups);

        return (
            <Wrapper>
                {Object.keys(sortedNotifications).map(group => (
                    <Group
                        groupNotifications={notificationGroups[group]}
                        type={group}
                    />
                ))}
            </Wrapper>
        );
    }
}

export default NotificationsGroup;