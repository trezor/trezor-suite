import { NotificationsTabContent } from './notifications/NotificationsTabContent';

type ActivityCenterTab = 'notifications' | 'system' | 'releaseNotes';

type Props = {
    activeTab: ActivityCenterTab;
};

export const ActivityCenterTabContent = ({ activeTab }: Props) => {
    switch (activeTab) {
        case 'notifications':
            return <NotificationsTabContent />;
        case 'system':
            return null; //TODO: https://github.com/trezor/trezor-suite/issues/30755
        case 'releaseNotes':
            return null; // TODO: https://github.com/trezor/trezor-suite/issues/30756
    }
};
