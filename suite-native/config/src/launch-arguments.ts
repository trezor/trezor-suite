import { LaunchArguments } from 'react-native-launch-arguments';

export type LaunchArguments = {
    detoxURLBlacklistRegex?: string;
    DTXDisableMainRunLoopSync?: boolean;
    isBluetoothEnabled?: boolean;
    isCardanoSendEnabled?: boolean;
    isConnectPopupEnabled_v2?: boolean;
    isDebugKeysAllowed?: boolean;
    isWalletConnectEnabled_v2?: boolean;
    isTradingBuyEnabled?: boolean;
    isTradingExchangeEnabled?: boolean;
    isTradingSellEnabled?: boolean;
    isDeviceConnectEnabled?: boolean;
    areDebugOnlyNetworksEnabled?: boolean;
    preloadedState?: Record<string, unknown>;
    isFirmwareUpdateEnabled?: boolean;
    isLocalizationEnabled?: boolean;
};

export const launchArguments = LaunchArguments.value<LaunchArguments>();
