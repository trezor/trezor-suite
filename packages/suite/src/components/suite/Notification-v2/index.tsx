import React from 'react';
import styled from 'styled-components';
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

const notify = toast;

export { NotificationsContainer, notify };
