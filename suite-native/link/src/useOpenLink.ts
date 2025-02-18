import { useCallback } from 'react';
import { Linking } from 'react-native';

import { useToast } from '@suite-native/toasts';

interface OpenLinkOptions {
    enforce?: boolean; // Bypasses canOpenURL check, needed for URLs meant to open in external apps.
}

export const useOpenLink = () => {
    const { showToast } = useToast();

    const showErrorToast = useCallback(() => {
        showToast({
            variant: 'error',
            icon: 'warning',
            message: 'Unable to open the link',
        });
    }, [showToast]);

    const handleOpenLink = useCallback(
        async (href: string, { enforce }: OpenLinkOptions = {}) => {
            try {
                const canOpenURL = await Linking.canOpenURL(href);

                if (!canOpenURL && !enforce) {
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
