import { Card } from '@trezor/components';

import { DashboardSection } from 'src/components/dashboard';
import { Notifications, Translation } from 'src/components/suite';
import { useLayout } from 'src/hooks/suite';

const NotificationsView = () => {
    useLayout('Notifications');

    return (
        <DashboardSection heading={<Translation id="NOTIFICATIONS_TITLE" />}>
            <Card>
                <Notifications />
            </Card>
        </DashboardSection>
    );
};

export default NotificationsView;
