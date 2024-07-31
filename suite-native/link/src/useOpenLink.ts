import { Linking } from 'react-native';
import { useCallback } from 'react';

import { useToast } from '@suite-native/toasts';

export const useOpenLink = () => {
    const { showToast } = useToast();

    const showErrorToast = useCallback(() => {
        showToast({
            variant: 'error',
            icon: 'warningTriangle',
            message: 'Unable to open the link',
        });
    }, [showToast]);

    const handleOpenLink = useCallback(
        async (href: string) => {
            try {
                const canOpenURL = await Linking.canOpenURL(href);

                if (!canOpenURL) {
                    showErrorToast();

                    return;
                }
                await Linking.openURL(href);
            } catch {
                showErrorToast();
            }
        },
        [showErrorToast],
    );

    return handleOpenLink;
};
