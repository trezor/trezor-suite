import { useCallback } from 'react';

import { useNavigationRemoveActionInterceptor } from '@suite-native/navigation';

import {
    type StayOnScreenAlertOptions,
    useShowStayOnScreenAlert,
} from './useShowStayOnScreenAlert';

type UseNavigationRemoveInterceptorAlertProps = {
    onRemoveConfirmed: () => void;
    onStayConfirmed?: () => void;
    shouldPrevent?: boolean;
    alertOptions?: StayOnScreenAlertOptions;
};

export const useNavigationRemoveInterceptorAlert = ({
    onRemoveConfirmed,
    onStayConfirmed,
    shouldPrevent = true,
    alertOptions,
}: UseNavigationRemoveInterceptorAlertProps) => {
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

    useNavigationRemoveActionInterceptor({
        isEnabled: shouldPrevent,
        onInterceptedAction: onPreventedRemove,
        onAllowedAction: onAllowedRemove,
    });
};
