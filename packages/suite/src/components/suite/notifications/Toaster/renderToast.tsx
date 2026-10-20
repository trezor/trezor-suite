import { type NotificationEntry } from '@suite-common/toast-notifications';
import { type TranslationKey } from '@suite-lego/intl';

import { ToastNotificationView } from './ToastNotificationView';
import { NotificationRenderer } from '../NotificationRenderer/NotificationRenderer';

export const renderToast = (payload: NotificationEntry<TranslationKey>) => (
    <NotificationRenderer notification={payload} render={ToastNotificationView} />
);
