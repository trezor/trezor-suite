export type TurnOffSuiteSync = (params?: {
    // NOTE: This callback needs to be passed like this because the persistor() in native requires whole store
    ensureSettingsPersisted?: () => Promise<void>;
}) => Promise<void>;

export type TurnOffSuiteSyncDep = { turnOffSuiteSync: TurnOffSuiteSync };
