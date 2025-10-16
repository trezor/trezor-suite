import { LaunchArguments } from 'react-native-launch-arguments';

export type LaunchArguments = {
    detoxURLBlacklistRegex?: string;
    DTXDisableMainRunLoopSync?: boolean;
    isBluetoothEnabled?: boolean;
    isCardanoSendEnabled?: boolean;
    isDebugKeysAllowed?: boolean;
    isTradingBuyEnabled?: boolean;
    isTradingExchangeEnabled?: boolean;
    isTradingSellEnabled?: boolean;
    isDeviceConnectEnabled?: boolean;
    areDebugOnlyNetworksEnabled?: boolean;
    preloadedState?: Record<string, unknown>;
    isFirmwareUpdateEnabled?: boolean;
    isLocalizationEnabled?: boolean;
    isLocalFirstStorageEnabled?: boolean;
    areTradingExchangeDexesEnabled?: boolean;
    isTradingResidenceCheckEnabled?: boolean;
};

export const launchArguments = LaunchArguments.value<LaunchArguments>();
