import { Column } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { NotificationRenderer } from 'src/components/suite';
import type { AppState } from 'src/types/suite';

import { NotificationView } from './NotificationView';

interface NotificationListProps {
    notifications: AppState['notifications'];
}

export const NotificationList = ({ notifications }: NotificationListProps) => (
    <Column flex="1" alignItems="normal" hasDivider gap={spacings.xl}>
        {notifications.map(n => (
            <NotificationRenderer key={n.id} notification={n} render={NotificationView} />
        ))}
    </Column>
);
