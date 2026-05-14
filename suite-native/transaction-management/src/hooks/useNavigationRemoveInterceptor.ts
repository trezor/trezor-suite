import { useCallback } from 'react';

import { usePreventNavigationRemove } from '@suite-native/navigation';

import {
    type StayOnScreenAlertOptions,
    useShowStayOnScreenAlert,
} from './useShowStayOnScreenAlert';

type UseNavigationRemoveInterceptorProps = {
    onRemoveConfirmed: () => void;
    onStayConfirmed?: () => void;
    shouldPrevent?: boolean;
    alertOptions?: StayOnScreenAlertOptions;
};

export const useNavigationRemoveInterceptor = ({
    onRemoveConfirmed,
    onStayConfirmed,
    shouldPrevent = true,
    alertOptions,
}: UseNavigationRemoveInterceptorProps) => {
    const { showStayOnScreenAlert, hideStayOnScreenAlert } = useShowStayOnScreenAlert();

    const onAllowedRemove = useCallback(() => {
        hideStayOnScreenAlert();
    }, [hideStayOnScreenAlert]);

    const onPreventedRemove = useCallback(() => {
        showStayOnScreenAlert({
            onRemoveConfirmed,
            onStayConfirmed,
            alertOptions,
        });
    }, [alertOptions, onRemoveConfirmed, onStayConfirmed, showStayOnScreenAlert]);

    usePreventNavigationRemove({
        shouldPrevent,
        onPreventedRemove,
        onAllowedRemove,
    });
};
