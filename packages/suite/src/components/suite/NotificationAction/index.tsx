import React from 'react';
import styled from 'styled-components';
import { Notification } from '@trezor/components-v2';
import { notificationStyles } from '@suite-support/styles/notifications';
import { ToastContainer as NotificationContainer, toast } from 'react-toastify';

const Wrapper = styled.div`
    ${notificationStyles}
`;

const NotificationsContainer = () => (
    <Wrapper>
        <NotificationContainer />
    </Wrapper>
);

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
