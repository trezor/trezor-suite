import { useCallback } from 'react';
import { Platform } from 'react-native';
import Toast from 'react-native-root-toast'; // TODO: Remove when is our own notification UI ready.

import * as Clipboard from 'expo-clipboard';

export function useCopyToClipboard() {
    const copyToClipboard = useCallback(async (value: string, toastMessage?: string) => {
        await Clipboard.setStringAsync(value);

        if (Platform.OS === 'ios') {
            // Android is showing it's own copy-to-clipboard toast message
            // TODO: Replace with our own notification UI when ready.
            Toast.show(toastMessage ?? 'Copied to clipboard.');
        }
    }, []);
    return copyToClipboard;
}
