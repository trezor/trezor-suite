import { Column } from '@trezor/components';

import { NotificationRenderer } from 'src/components/suite/notifications/NotificationRenderer/NotificationRenderer';
import type { AppState } from 'src/types/suite';

import { NotificationView } from './NotificationView';

interface NotificationListProps {
    notifications: AppState['notifications'];
}

export const NotificationList = ({ notifications }: NotificationListProps) => (
    <Column flex="1" hasDivider gap={24}>
        {notifications.map(n => (
            <NotificationRenderer key={n.id} notification={n} render={NotificationView} />
        ))}
    </Column>
);
