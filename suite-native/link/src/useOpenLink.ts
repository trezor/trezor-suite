import { Linking } from 'react-native';
import { useDispatch } from 'react-redux';
import { useCallback } from 'react';

import { addToastNotification } from '@suite-native/toast-notifications';

export const useOpenLink = () => {
    const dispatch = useDispatch();

    const handleOpenLink = useCallback(
        async (href: string) => {
            try {
                await Linking.openURL(href);
            } catch {
                dispatch(
                    addToastNotification({
                        variant: 'error',
                        icon: 'warningTriangle',
                        message: 'Unable to open the link',
                    }),
                );
            }
        },
        [dispatch],
    );

    return handleOpenLink;
};
