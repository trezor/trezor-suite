export type LaunchArguments = {
    detoxURLBlacklistRegex?: string;
    DTXDisableMainRunLoopSync?: boolean;
    isCardanoSendEnabled?: boolean;
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
    isTradingSlip24Enabled?: boolean;
    isN4w1BackupEnabled?: boolean;
    isN4W1BackupEnabled?: boolean;
    isActivityCenterEnabled?: boolean;
};
