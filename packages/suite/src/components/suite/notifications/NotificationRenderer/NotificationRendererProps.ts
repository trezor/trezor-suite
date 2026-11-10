import { type ComponentType } from 'react';

import { type TranslationKey } from '@suite/intl';
import { type NotificationEntry } from '@suite-common/toast-notifications';

import { type NotificationViewProps } from '../Notifications/NotificationGroup/NotificationList/NotificationView';

type LocalizedNotificationEntry = NotificationEntry<TranslationKey>;

export type NotificationRendererProps<
    T extends LocalizedNotificationEntry['type'] = LocalizedNotificationEntry['type'],
> = {
    render: ComponentType<{ onCancel?: () => void } & NotificationViewProps>;
    notification: Extract<LocalizedNotificationEntry, { type: T }>;
};
