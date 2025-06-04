import { Translation } from '@suite-native/intl';

import { InfoCard } from './InfoCard';

export const BtcOnlyFirmwareInfo = () => (
    <InfoCard
        title={<Translation id="moduleTrading.error.btcOnlyFirmwareTitle" />}
        description={<Translation id="moduleTrading.error.btcOnlyFirmwareDescription" />}
    />
);
