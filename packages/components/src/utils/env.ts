type Platform = 'web' | 'react-native';
export const getPlatform = (): Platform => {
    let platform: Platform = 'web';
    if (typeof document !== 'undefined') {
        platform = 'web';
    } else if (typeof navigator !== 'undefined' && navigator.product === 'ReactNative') {
        platform = 'react-native';
    } else {
        // nodejs
        platform = 'web';
    }
    return platform;
};

export const platform = getPlatform();
