import { useCallback } from 'react';
import { Platform } from 'react-native';

import * as Clipboard from 'expo-clipboard';

import { useToast } from '@suite-native/toasts';

export function useCopyToClipboard() {
    const { showToast } = useToast();

    const copyToClipboard = useCallback(
        async (value: string, toastMessage?: string) => {
            await Clipboard.setStringAsync(value);

            if (Platform.OS === 'ios') {
                // Android is showing it's own copy-to-clipboard toast message
                showToast({
                    variant: 'default',
                    message: toastMessage ?? 'Copied to clipboard.',
                    icon: 'copy',
                });
            }
        },
        [showToast],
    );
    return copyToClipboard;
}
