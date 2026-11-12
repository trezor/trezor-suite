import { useSelector } from 'react-redux';

import {
    selectIsDeviceCompromised,
    selectIsDiscoveryEntropyCheckEnabledAndFailed,
    selectIsFirmwareAuthenticityCheckEnabledAndHardFailed,
} from '@suite/authenticity-checks';
import {
    Feature,
    type MessageSystemRootState,
    selectIsAllTradingDisabled,
    selectIsFeatureDisabled,
} from '@suite-common/message-system';
import { type TradingTypeWithConcierge } from '@suite-common/trading';

import { getTradingAvailability } from './getTradingAvailability';

export const useTradingAvailability = (type: TradingTypeWithConcierge) => {
    const isAnyDeviceCheckFailed = useSelector(selectIsDeviceCompromised);
    const isFirmwareCheckHardFailed = useSelector(
        selectIsFirmwareAuthenticityCheckEnabledAndHardFailed,
    );
    const isDiscoveryEntropyCheckFailed = useSelector(
        selectIsDiscoveryEntropyCheckEnabledAndFailed,
    );
    const isTypeDisabled = useSelector((state: MessageSystemRootState) =>
        selectIsFeatureDisabled(state, Feature.trading[type]),
    );
    const isAllTradingDisabled = useSelector(selectIsAllTradingDisabled);

    const isDeviceCompromised = isFirmwareCheckHardFailed || isDiscoveryEntropyCheckFailed;

    return getTradingAvailability({
        type,
        isDeviceCompromised,
        isDeviceCheckInconclusive: isAnyDeviceCheckFailed && !isDeviceCompromised,
        isTypeDisabled,
        isAllTradingDisabled,
    });
};
