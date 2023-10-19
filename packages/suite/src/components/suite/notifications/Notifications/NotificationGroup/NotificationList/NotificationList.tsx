import styled from 'styled-components';

import { NotificationRenderer } from 'src/components/suite';
import { NotificationView } from './NotificationView';
import type { AppState } from 'src/types/suite';

const Wrapper = styled.div`
    display: flex;
    flex: 1;
    flex-direction: column;
    max-width: 100%;
`;

interface NotificationListProps {
    notifications: AppState['notifications'];
}

export const NotificationList = ({ notifications }: NotificationListProps) => (
    <Wrapper>
        {notifications.map(n => (
            <NotificationRenderer key={n.id} notification={n} render={NotificationView} />
        ))}
    </Wrapper>
);
