import { useCallback } from 'react';
import { Platform } from 'react-native';
import { useDispatch } from 'react-redux';

import * as Clipboard from 'expo-clipboard';

import { addToastNotification } from '@suite-native/toast-notifications';

export function useCopyToClipboard() {
    const dispatch = useDispatch();
    const copyToClipboard = useCallback(
        async (value: string, toastMessage?: string) => {
            await Clipboard.setStringAsync(value);

            if (Platform.OS === 'ios') {
                // Android is showing it's own copy-to-clipboard toast message
                dispatch(
                    addToastNotification({
                        variant: 'default',
                        message: toastMessage ?? 'Copied to clipboard.',
                        icon: 'copy',
                    }),
                );
            }
        },
        [dispatch],
    );
    return copyToClipboard;
}
