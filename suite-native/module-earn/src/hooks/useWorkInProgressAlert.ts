import { useCallback } from 'react';

import { useAlert } from '@suite-native/alerts';

export const useWorkInProgressAlert = () => {
    const { showAlert } = useAlert();

    return useCallback(
        () =>
            showAlert({
                title: 'Work in progress',
                description: 'This action is not available yet.',
                primaryButtonTitle: 'Got it',
            }),
        [showAlert],
    );
};
