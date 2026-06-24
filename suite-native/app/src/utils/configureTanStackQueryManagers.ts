import { AppState } from 'react-native';

import NetInfo from '@react-native-community/netinfo';

import { focusManager, onlineManager } from '@suite-common/react-query';

export const configureTanStackQueryManagers = () => {
    onlineManager.setEventListener((setOnline: (online: boolean) => void) =>
        // isConnected is null while NetInfo is still initialising — treat unknown as online
        // so TQ doesn't park fetches during startup. Only false (definitively offline) pauses.
        NetInfo.addEventListener(state => setOnline(state.isConnected !== false)),
    );

    focusManager.setEventListener((setFocused: (focused: boolean) => void) => {
        const subscription = AppState.addEventListener('change', state => {
            setFocused(state === 'active');
        });

        return () => subscription.remove();
    });
};
