import React from 'react';
import { Notification } from '@trezor/components-v2';
import { toast } from 'react-toastify';

const notify = (
    title: string,
    state?: 'success' | 'info' | 'warning' | 'error',
    message?: string,
    isLoading?: boolean,
) => {
    toast(
        <Notification
            title={title}
            message={message}
            state={state || 'info'}
            isLoading={isLoading || false}
        />,
        {
            autoClose: false,
            position: 'bottom-center',
        },
    );
};

export { notify };
export default NotificationsContainer;
