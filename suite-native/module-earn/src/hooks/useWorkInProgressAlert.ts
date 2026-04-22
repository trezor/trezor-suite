import { useCallback } from 'react';
import { type GestureResponderEvent } from 'react-native';

import { useAlert } from '@suite-native/alerts';

export const useWorkInProgressAlert = () => {
    const { showAlert } = useAlert();

    return useCallback(
        (titleOrEvent?: string | GestureResponderEvent) =>
            showAlert({
                title: typeof titleOrEvent === 'string' ? titleOrEvent : 'Work in progress',
                description: 'This action is not available yet.',
                primaryButtonTitle: 'Got it',
            }),
        [showAlert],
    );
};
