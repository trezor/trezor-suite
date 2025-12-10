// FIX: Reanimated 4 logger crashes when __reanimatedLoggerConfig is not set
// "TypeError: Cannot read property 'level' of undefined"
// This must be configured before any reanimated code runs.

global.__reanimatedLoggerConfig = {
    strict: false,
    level: global.process?.env?.EXPO_PUBLIC_IS_DETOX_BUILD === 'true' ? 2 : 1, // 2 = errors only, 1 = warnings and errors
    logFunction: data => {
        if (data.level === 2) {
            console.error('[Reanimated]', data.message);
        } else if (data.level === 1 && __DEV__) {
            console.warn('[Reanimated]', data.message);
        }
    },
};
