import { AppState } from 'react-native';

import type { SubscribeToForeground } from '@suite-common/earn-staking';

export const subscribeToAppForeground: SubscribeToForeground = listener => {
    const subscription = AppState.addEventListener('change', appState => {
        if (appState === 'active') listener();
    });

    return () => subscription.remove();
};
