import { useCallback } from 'react';
import Toast from 'react-native-root-toast'; // TODO: Remove when is our own notification UI ready.

import * as Clipboard from 'expo-clipboard';

export function useCopyToClipboard() {
    const copyToClipboard = useCallback(async (value: string, toastMessage?: string) => {
        await Clipboard.setStringAsync(value);

        // TODO: Replace with our own notification UI when ready.
        Toast.show(toastMessage ?? 'Copied to clipboard.');
    }, []);
    return copyToClipboard;
}
