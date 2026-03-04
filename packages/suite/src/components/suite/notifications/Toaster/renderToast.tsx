import { TranslationKey } from '@suite/intl';
import { NotificationEntry } from '@suite-common/toast-notifications';

import { ToastNotificationView } from './ToastNotificationView';
import { NotificationRenderer } from '../NotificationRenderer/NotificationRenderer';

export const renderToast = (payload: NotificationEntry<TranslationKey>) => (
    <NotificationRenderer notification={payload} render={ToastNotificationView} />
);
