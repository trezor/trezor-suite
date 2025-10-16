import { LaunchArguments } from 'react-native-launch-arguments';

export type LaunchArguments = {
    detoxURLBlacklistRegex?: string;
    DTXDisableMainRunLoopSync?: boolean;
    isCardanoSendEnabled?: boolean;
    isDebugKeysAllowed?: boolean;
    isTradingBuyEnabled?: boolean;
    isTradingExchangeEnabled?: boolean;
    isTradingSellEnabled?: boolean;
    areDebugOnlyNetworksEnabled?: boolean;
    areExperimentalOnlyNetworksEnabled?: boolean;
    preloadedState?: string; // stringified object
    isFirmwareUpdateEnabled?: boolean;
    isLocalizationEnabled?: boolean;
    isLocalFirstStorageEnabled?: boolean;
    areTradingExchangeDexesEnabled?: boolean;
    isTradingResidenceCheckEnabled?: boolean;
};

export const launchArguments = LaunchArguments.value<LaunchArguments>();
