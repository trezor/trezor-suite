import React from 'react';
import styled from 'styled-components';
import NotificationRenderer from '@suite-components/NotificationRenderer';
import NotificationView from '../NotificationView';
import type { AppState } from '@suite-types';

const Wrapper = styled.div`
    display: flex;
    flex: 1;
    flex-direction: column;
    max-width: 100%;
`;

interface Props {
    notifications: AppState['notifications'];
}

const NotificationList = ({ notifications }: Props) => (
    <Wrapper>
        {notifications.map(n => (
            <NotificationRenderer key={n.id} notification={n} render={NotificationView} />
        ))}
    </Wrapper>
);

export default NotificationList;
