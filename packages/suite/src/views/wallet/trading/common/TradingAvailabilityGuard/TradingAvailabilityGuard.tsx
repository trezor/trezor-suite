import { type ReactNode } from 'react';

import { type TradingTypeWithConcierge } from '@suite-common/trading';
import { exhaustive } from '@trezor/type-utils';

import { TradingAllDisabled } from './TradingAllDisabled';
import { TradingDeviceCompromised } from './TradingDeviceCompromised';
import { TradingTypeDisabled } from './TradingTypeDisabled';
import { useTradingAvailability } from './useTradingAvailability';

type TradingAvailabilityGuardProps = {
    type: TradingTypeWithConcierge;
    children: ReactNode;
};

export const TradingAvailabilityGuard = ({ type, children }: TradingAvailabilityGuardProps) => {
    const availability = useTradingAvailability(type);

    switch (availability) {
        case 'deviceCompromised':
            return <TradingDeviceCompromised />;
        case 'allTradingDisabled':
            return <TradingAllDisabled />;
        case 'typeDisabled':
            return <TradingTypeDisabled type={type} />;
        case 'available':
            return children;
        default:
            return exhaustive(availability);
    }
};
