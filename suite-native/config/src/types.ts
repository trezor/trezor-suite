export type LaunchArguments = {
    detoxURLBlacklistRegex?: string;
    DTXDisableMainRunLoopSync?: boolean;
    isDebugKeysAllowed?: boolean;
    isTradingBuyEnabled?: boolean;
    isTradingExchangeEnabled?: boolean;
    isTradingSellEnabled?: boolean;
    isTradingConciergeEnabled?: boolean;
    areDebugOnlyNetworksEnabled?: boolean;
    areExperimentalOnlyNetworksEnabled?: boolean;
    preloadedState?: string; // stringified object
    isFirmwareUpdateEnabled?: boolean;
    isTradingResidenceCheckEnabled?: boolean;
    isTradingDebugEnabled?: boolean;
    isN4w1BackupEnabled?: boolean;
};
