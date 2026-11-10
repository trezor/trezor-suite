import { type TranslationKey } from '@suite/intl';
import { type NotificationsState } from '@suite-common/toast-notifications';
import { Column } from '@trezor/components';

import { NotificationView } from './NotificationView';
import { NotificationRenderer } from '../../../NotificationRenderer/NotificationRenderer';

interface NotificationListProps {
    notifications: NotificationsState<TranslationKey>;
}

export const NotificationList = ({ notifications }: NotificationListProps) => (
    <Column flex="1" hasDivider gap={24}>
        {notifications.map(n => (
            <NotificationRenderer key={n.id} notification={n} render={NotificationView} />
        ))}
    </Column>
);
