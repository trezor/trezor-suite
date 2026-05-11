import { Platform } from 'react-native';

import { type NdefRecord, type NfcIntentEvent, ReactNativeNfcModule } from './ReactNativeNfcModule';

export type { NdefRecord, NfcIntentEvent };

export const getLaunchNdefRecords = (): NdefRecord[] => {
    // TODO add iOS support
    if (Platform.OS !== 'android') {
        return [];
    }

    return ReactNativeNfcModule.getLaunchNdefRecords();
};

export const addNfcIntentListener = (callback: (event: NfcIntentEvent) => void): (() => void) => {
    // TODO add support for iOS
    if (Platform.OS !== 'android') {
        return () => {};
    }

    const subscription = ReactNativeNfcModule.addListener('onNfcIntent', callback);

    return () => subscription.remove();
};
