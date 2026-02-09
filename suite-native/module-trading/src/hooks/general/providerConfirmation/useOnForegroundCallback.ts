import { useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

import { captureSentryException } from '@suite-native/sentry';

class AppStateChangeError extends Error {
    constructor(cause?: unknown) {
        super('Error thrown in callback provided to useOnForegroundCallback');
        this.cause = cause;
        this.name = 'AppStateChangeError';
    }
}

export const useOnForegroundCallback = (callback: () => void | Promise<void>) => {
    const appState = useRef(AppState.currentState);
    const [appIsInForeground, setAppIsInForeground] = useState(AppState.currentState === 'active');
    const [shouldWatchForForeground, setShouldWatchForForeground] = useState(false);

    useEffect(() => {
        const handler = AppState.addEventListener('change', nextAppState => {
            if (appState.current !== 'active' && nextAppState === 'active') {
                setAppIsInForeground(true);
            }
            if (appState.current === 'active' && nextAppState !== 'active') {
                setAppIsInForeground(false);
            }
            appState.current = nextAppState;
        });

        return () => handler.remove();
    }, []);

    useEffect(() => {
        if (appIsInForeground && shouldWatchForForeground) {
            setShouldWatchForForeground(false);
            (async () => {
                try {
                    await callback();
                } catch (error: unknown) {
                    console.warn(
                        'Callback provided to useOnForegroundCallback threw an error. It should be handled inside the callback itself.',
                        error,
                    );
                    captureSentryException(new AppStateChangeError(error));
                }
            })();
        }
    }, [appIsInForeground, shouldWatchForForeground, callback]);

    return {
        shouldWatchForForeground,
        setShouldWatchForForeground,
    };
};
