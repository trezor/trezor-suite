export const getRuntimeEnvironment = (): 'native' | 'desktop' | 'web' | undefined => {
    // React Native
    if (typeof window === 'undefined' && typeof navigator !== 'undefined') {
        return 'native';
    }

    // Electron (both main and renderer)
    if (typeof process !== 'undefined' && process.versions?.electron) {
        return 'desktop';
    }

    // Browser
    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
        return 'web';
    }

    return undefined;
};
