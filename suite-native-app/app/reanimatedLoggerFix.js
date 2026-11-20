// FIX: Reanimated 4 logger crashes in Detox debug mode
// "TypeError: Cannot read property 'level' of undefined"

if (global.process.env.EXPO_PUBLIC_IS_DETOX_BUILD === 'true') {
    global.__reanimatedLoggerConfig = {
        strict: false,
        level: 2, // only show errors
        logFunction: data => {
            if (data.level === 2) {
                console.error(data.message);
            }
        },
    };
}
