import React from 'react';
import styled from 'styled-components';

import { Card, Notifications, Translation } from '@suite-components';
import { Section } from '@dashboard-components';

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
