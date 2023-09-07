import styled from 'styled-components';
import { Card } from '@trezor/components';

import { Notifications, Translation } from 'src/components/suite';
import { DashboardSection } from 'src/components/dashboard';

const StyledSection = styled(DashboardSection)`
    width: 100%;
`;

const NotificationsView = () => (
    <StyledSection heading={<Translation id="NOTIFICATIONS_TITLE" />}>
        <Card paddingType="none">
            <Notifications />
        </Card>
    </StyledSection>
);

export default NotificationsView;
