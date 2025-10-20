import { Translation } from '@suite-native/intl';

import { InfoCard } from './InfoCard';

export const BtcOnlyFirmwareInfo = () => (
    <InfoCard
        title={<Translation id="tradingAtoms.error.btcOnlyFirmwareTitle" />}
        description={<Translation id="tradingAtoms.error.btcOnlyFirmwareDescription" />}
    />
);
