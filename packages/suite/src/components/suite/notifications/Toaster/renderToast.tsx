import { NotificationEntry } from '@suite-common/toast-notifications';

import { ToastNotificationView } from './ToastNotificationView';
import { NotificationRenderer } from '../NotificationRenderer/NotificationRenderer';

export const renderToast = (payload: NotificationEntry) => (
    <NotificationRenderer notification={payload} render={ToastNotificationView} />
);
