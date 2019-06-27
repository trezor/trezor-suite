import * as React from 'react';
import * as NotificationActions from '@wallet-actions/NotificationActions';
import { NotificationEntry } from '@wallet-reducers/notificationReducer';
import NotificationsGroups from './components/NotificationsGroups';

// TODO
interface Props {
    notifications: NotificationEntry[];
    close: typeof NotificationActions.close;
}

export default ({ notifications, close }: Props) => {
    return <NotificationsGroups notifications={notifications} close={close} />;
};
