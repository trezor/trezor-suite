import type { NotificationsRootState } from './notificationsReducer';

export const selectNotifications = (state: NotificationsRootState) => state.notifications;
