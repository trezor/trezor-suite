import { AppState, type AppStateStatus } from 'react-native';

type AppStateListener = (appState: AppStateStatus) => void;

/**
 * Makes the AppState jest mock controllable: sets `currentState` and delivers `change` events
 * to listeners that are still subscribed.
 */
export const mockAppState = (initialAppState: AppStateStatus) => {
    const listeners = new Set<AppStateListener>();

    AppState.currentState = initialAppState;
    jest.spyOn(AppState, 'addEventListener').mockImplementation((_type, listener) => {
        const appStateListener = listener as AppStateListener;
        listeners.add(appStateListener);

        return {
            remove: () => {
                listeners.delete(appStateListener);
            },
        };
    });

    return {
        changeAppState: (appState: AppStateStatus) => {
            AppState.currentState = appState;
            // Like the React Native emitter, notify only listeners subscribed before the change.
            Array.from(listeners).forEach(listener => listener(appState));
        },
        getListenerCount: () => listeners.size,
    };
};
