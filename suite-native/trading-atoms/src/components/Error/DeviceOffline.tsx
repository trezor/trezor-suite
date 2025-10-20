import { Translation } from '@suite-native/intl';

import { WarningCard } from './WarningCard';

export const DeviceOffline = () => (
    <WarningCard
        title={<Translation id="tradingAtoms.error.deviceOfflineTitle" />}
        description={<Translation id="tradingAtoms.error.deviceOfflineDescription" />}
    />
);
