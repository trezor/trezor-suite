import { Translation } from '@suite/intl';

import { TradingUnavailableCard } from './TradingUnavailableCard';

export const TradingDeviceCompromised = () => (
    <TradingUnavailableCard
        data-testid="@trading/device-compromised"
        title={<Translation id="TR_DEVICE_COMPROMISED_HEADING" />}
        description={<Translation id="TR_DEVICE_COMPROMISED_TEXT" />}
    />
);
