import React from 'react';
import styled from 'styled-components';
import { Card } from '@trezor/components';

import { Notifications, Translation } from 'src/components/suite';
import { Section } from 'src/components/dashboard';

const StyledSection = styled(Section)`
    width: 100%;
`;

const NotificationsView = () => (
    <StyledSection heading={<Translation id="NOTIFICATIONS_TITLE" />}>
        <Card noPadding>
            <Notifications />
        </Card>
    </StyledSection>
);

export default NotificationsView;
