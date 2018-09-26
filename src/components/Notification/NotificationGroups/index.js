import React, { Component } from 'react';
import styled from 'styled-components';

import Group from './components/Group';

const Wrapper = styled.div``;

class NotificationsGroup extends Component {
    constructor() {
        super();
        this.notificationPriority = {
            error: 0,
            warning: 1,
            info: 2,
            success: 3,
        };

        this.notifications = [
            { type: 'warning' },
            { type: 'error' },
            { type: 'info' },
            { type: 'error' },
            { type: 'warning' },
            { type: 'success' },
            { type: 'error' },
            { type: 'error' },
        ];
    }

    getGroupNotifications(notifications, type) {
        return notifications.filter(item => item.type === type);
    }

    groupNotifications = (items, key) => items.reduce(
        (result, item) => ({
            ...result,
            [item[key]]: [...(result[item[key]] || []), item],
        }),
        {},
    );

    sortByPriority(notifications) {
        const sorted = Object.keys(notifications).sort((a, b) => {
            // sort
        });
        return sorted;
    }

    render() {
        const { notifications } = this;
        const notificationGroups = this.groupNotifications(notifications, 'type');
        const sortedNotifications = this.sortByPriority(notificationGroups);

        return (
            <Wrapper>
                {sortedNotifications.map(group => (
                    <Group
                        notifications={this.getGroupNotifications(group.type, sortedNotifications)}
                        type={group.type}
                    />
                ))}
            </Wrapper>
        );
    }
}

export default NotificationsGroup;