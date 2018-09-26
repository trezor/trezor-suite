import React, { Component } from 'react';
import styled from 'styled-components';
import colors from 'config/colors';

import { PRIORITY } from 'constants/notifications';
import Group from './components/Group';

const Wrapper = styled.div``;

class NotificationsGroup extends Component {
    constructor() {
        super();
        this.notifications = [
            { type: 'warning', title: 'aaa', message: 'aaaa' },
            { type: 'error', title: 'aaa', message: 'aaaa' },
            { type: 'info', title: 'aaa', message: 'aaaa' },
            { type: 'error', title: 'aaa', message: 'aaaa' },
            { type: 'warning', title: 'aaa', message: 'aaaa' },
            { type: 'success', title: 'aaa', message: 'aaaa' },
            { type: 'error', title: 'aaa', message: 'aaaa' },
            { type: 'error', title: 'aaa', message: 'aaaa' },
        ];
    }

    getColor = (type) => {
        let color;
        switch (type) {
            case 'info':
                color = colors.INFO_PRIMARY;
                break;
            case 'error':
                color = colors.ERROR_PRIMARY;
                break;
            case 'warning':
                color = colors.WARNING_PRIMARY;
                break;
            case 'success':
                color = colors.SUCCESS_PRIMARY;
                break;
            default:
                color = null;
        }
        return color;
    };

    groupNotifications = notifications => notifications.reduce((acc, obj) => {
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
        const notificationGroups = this.groupNotifications(notifications, 'type');
        const sortedNotifications = this.sortByPriority(notificationGroups);

        return (
            <Wrapper>
                {Object.keys(sortedNotifications).map(group => (
                    <Group
                        groupNotifications={notificationGroups[group]}
                        color={this.getColor(group)}
                        type={group}
                    />
                ))}
            </Wrapper>
        );
    }
}

export default NotificationsGroup;