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
    areTradingExchangeDexesEnabled?: boolean;
    isTradingResidenceCheckEnabled?: boolean;
    isTradingDebugEnabled?: boolean;
    isEarnEnabled?: boolean;
    isStablecoinYieldEnabled?: boolean;
    isN4W1BackupEnabled?: boolean;
};
