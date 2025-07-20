import { LaunchArguments } from 'react-native-launch-arguments';

export type LaunchArguments = {
    detoxURLBlacklistRegex?: string;
    DTXDisableMainRunLoopSync?: boolean;
    isBluetoothEnabled?: boolean;
    isCardanoSendEnabled?: boolean;
    isConnectPopupEnabled?: boolean;
    isDebugKeysAllowed?: boolean;
    isWalletConnectEnabled?: boolean;
    isTradingBuyEnabled?: boolean;
    isTradingExchangeEnabled?: boolean;
    isTradingSellEnabled?: boolean;
    isCheckBackupsEnabled?: boolean;
    isDeviceConnectEnabled?: boolean;
    isViewOnlyByDefaultEnabled?: boolean;
};

export const launchArguments = LaunchArguments.value<LaunchArguments>();
