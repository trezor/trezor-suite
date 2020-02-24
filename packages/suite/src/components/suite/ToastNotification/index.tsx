import React from 'react';
import { ToastNotification } from '@suite-reducers/notificationReducer';
import Toast from './components/Toast';
import { Dispatch } from '@suite-types';

import { getNotificationMessage } from '@suite-utils/notifications';

export const getContent = (notification: ToastNotification, dispatch: Dispatch) => {
    const item = getNotificationMessage(notification, dispatch);
    return <Toast {...item} />;
};
