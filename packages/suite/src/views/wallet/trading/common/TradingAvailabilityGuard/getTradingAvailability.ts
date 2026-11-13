import { type TradingTypeWithConcierge } from '@suite-common/trading';

export type TradingAvailability =
    'deviceCompromised' | 'allTradingDisabled' | 'typeDisabled' | 'available';

type GetTradingAvailabilityParams = {
    type: TradingTypeWithConcierge;
    isDeviceCompromised: boolean;
    isDeviceCheckInconclusive: boolean;
    isTypeDisabled: boolean;
    isAllTradingDisabled: boolean;
};

export const getTradingAvailability = ({
    type,
    isDeviceCompromised,
    isDeviceCheckInconclusive,
    isTypeDisabled,
    isAllTradingDisabled,
}: GetTradingAvailabilityParams): TradingAvailability => {
    if (isDeviceCompromised) {
        return 'deviceCompromised';
    }

    const isTradingTab = type !== 'concierge';

    if (isAllTradingDisabled && isTradingTab) {
        return 'allTradingDisabled';
    }

    if (isTypeDisabled || isDeviceCheckInconclusive) {
        return 'typeDisabled';
    }

    return 'available';
};
