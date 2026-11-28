import { AppState } from 'react-native';

export const waitForActiveAppState = (): Promise<void> =>
    new Promise(resolve => {
        const subscription = AppState.addEventListener('change', appState => {
            if (appState === 'active') {
                subscription.remove();
                resolve();
            }
        });

        // The app may have become active before the listener was registered.
        if (AppState.currentState === 'active') {
            subscription.remove();
            resolve();
        }
    });
