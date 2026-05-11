import { useCallback } from 'react';

import * as Clipboard from 'expo-clipboard';

import { useTranslate } from '@suite-native/intl';
import { useToast } from '@suite-native/toasts';

export function useCopyToClipboard() {
    const { translate } = useTranslate();
    const { showToast } = useToast();

    const copyToClipboard = useCallback(
        async (value: string, toastMessage?: string) => {
            await Clipboard.setStringAsync(value);

            showToast({
                intent: 'neutral',
                message: toastMessage ?? translate('moduleClipboard.copiedToClipboard'),
                icon: 'copy',
            });
        },
        [showToast, translate],
    );

    return copyToClipboard;
}
