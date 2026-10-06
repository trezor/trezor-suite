import { useCallback } from 'react';

import * as Clipboard from 'expo-clipboard';

import { useTranslate } from '@suite-native/intl';
import { useToast } from '@suite-native/toasts';

type CopyToClipboardOptions = {
    shouldShowToast?: boolean;
};

export function useCopyToClipboard() {
    const { translate } = useTranslate();
    const { showToast } = useToast();

    const copyToClipboard = useCallback(
        async (
            value: string,
            toastMessage?: string,
            { shouldShowToast = true }: CopyToClipboardOptions = {},
        ) => {
            await Clipboard.setStringAsync(value);

            if (shouldShowToast) {
                showToast({
                    intent: 'neutral',
                    message: toastMessage ?? translate('moduleClipboard.copiedToClipboard'),
                    icon: 'copy',
                });
            }
        },
        [showToast, translate],
    );

    return copyToClipboard;
}
