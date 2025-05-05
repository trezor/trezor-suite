import { Translation } from '@suite-native/intl';

import { OfflineCard } from './OfflineCard';

export const DeviceOffline = () => (
    <OfflineCard
        title={<Translation id="moduleTrading.error.deviceOfflineTitle" />}
        description={<Translation id="moduleTrading.error.deviceOfflineDescription" />}
    />
);
