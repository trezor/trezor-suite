import { Alert } from 'react-native';

import * as SplashScreen from 'expo-splash-screen';

import { type ReloadAppDep } from '@suite-common/suite-types';
import { type ClearStorageDep } from '@suite-native/storage';

export type AlertStorageLoadFailureDeps = ClearStorageDep & ReloadAppDep;

export type AlertStorageLoadFailure = () => void;

export type AlertStorageLoadFailureDep = { alertStorageLoadFailure: AlertStorageLoadFailure };

export const createAlertStorageLoadFailure =
    (deps: AlertStorageLoadFailureDeps): AlertStorageLoadFailure =>
    () => {
        // If storage can't load, app is never set as ready so we need to hide splash screen here to make the alert visible.
        SplashScreen.hideAsync();
        Alert.alert(
            'Unable to load app data',
            'Try restarting the app. If the issue persists, you may need to clear the app’s storage. This won’t affect assets on your Trezor device.',
            [
                {
                    text: 'Clear app storage',
                    onPress: () => {
                        // The alert is shown only when the encrypted storage failed to open.
                        deps.clearStorage({ mmkvInstance: null });
                        deps.reloadApp();
                    },
                    style: 'destructive',
                },
                {
                    text: 'Restart app',
                    onPress: () => {
                        deps.reloadApp();
                    },
                    isPreferred: true,
                    style: 'default',
                },
            ],
        );
    };
