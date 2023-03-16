import { Linking } from 'react-native';
import { useCallback } from 'react';

import { useToast } from '@suite-native/toasts';

export const useOpenLink = () => {
    const { showToast } = useToast();

    const handleOpenLink = useCallback(
        async (href: string) => {
            try {
                await Linking.openURL(href);
            } catch {
                showToast({
                    variant: 'error',
                    icon: 'warningTriangle',
                    message: 'Unable to open the link',
                });
            }
        },
        [showToast],
    );

    return handleOpenLink;
};
