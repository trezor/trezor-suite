import * as React from 'react';
import { close } from '@suite-actions/notificationActions';
import { NotificationEntry } from '@suite-reducers/notificationReducer';
import NotificationsGroups from './components/NotificationsGroups';

// TODO
interface Props {
    notifications: NotificationEntry[];
    close: typeof close;
}

export default ({ notifications, close }: Props) => {
    return <NotificationsGroups notifications={notifications} close={close} />;
};
