import { Translation } from '@suite-native/intl';

import { WarningCard } from './WarningCard';

export const DeviceOffline = () => (
    <WarningCard
        title={<Translation id="moduleTrading.error.deviceOfflineTitle" />}
        description={<Translation id="moduleTrading.error.deviceOfflineDescription" />}
    />
);
