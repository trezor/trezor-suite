import { useCallback } from 'react';

import {
    BACK_NAVIGATION_ACTIONS,
    useNavigationRemoveGuard,
    useOnNavigationRemove,
} from '@suite-native/navigation';

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

    const onPreventedRemove = useCallback(() => {
        showStayOnScreenAlert({
            onRemoveConfirmed,
            onStayConfirmed,
            alertOptions,
        });
    }, [alertOptions, onRemoveConfirmed, onStayConfirmed, showStayOnScreenAlert]);

    useOnNavigationRemove({
        isEnabled: shouldPrevent,
        onRemoveAttempt: action => {
            if (!BACK_NAVIGATION_ACTIONS.includes(action.type)) {
                hideStayOnScreenAlert();
            }
        },
    });

    useNavigationRemoveGuard({
        isEnabled: shouldPrevent,
        actionTypes: BACK_NAVIGATION_ACTIONS,
        onBlocked: onPreventedRemove,
    });
};
