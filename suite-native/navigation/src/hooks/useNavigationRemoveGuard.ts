import { useCallback, useRef } from 'react';

import { type NavigationAction, useNavigation, usePreventRemove } from '@react-navigation/native';

import {
    DEFAULT_BACK_NAVIGATION_ACTIONS,
    type NavigationRemoveActionTypes,
    matchesNavigationRemoveAction,
} from '../navigationRemove';

type OnBlockedParams = {
    action: NavigationAction;
    forceNavigation: (navigate: () => void) => void;
};

export type UseNavigationRemoveGuardParams = {
    /** Defaults to true. Disabling the guard also disables its callback. */
    isEnabled?: boolean;
    /** Defaults to back navigation actions; an empty list blocks none. */
    actionTypes?: NavigationRemoveActionTypes;
    /** Returning or resolving leaves navigation blocked. Omit to block unconditionally. */
    onBlocked?: (params: OnBlockedParams) => void | Promise<void>;
};

/**
 * Blocks selected screen-removal attempts. Other removal actions continue automatically.
 *
 * Returns forceNavigation, which runs a new navigation without this guard.
 */
export const useNavigationRemoveGuard = ({
    isEnabled = true,
    actionTypes = DEFAULT_BACK_NAVIGATION_ACTIONS,
    onBlocked,
}: UseNavigationRemoveGuardParams = {}) => {
    const navigation = useNavigation();
    const isForcingNavigationRef = useRef(false);

    const forceNavigation = useCallback((navigate: () => void) => {
        const wasForcingNavigation = isForcingNavigationRef.current;
        isForcingNavigationRef.current = true;

        try {
            navigate();
        } finally {
            isForcingNavigationRef.current = wasForcingNavigation;
        }
    }, []);

    usePreventRemove(isEnabled, ({ data }) => {
        if (
            isForcingNavigationRef.current ||
            !matchesNavigationRemoveAction(actionTypes, data.action)
        ) {
            navigation.dispatch(data.action);

            return;
        }

        onBlocked?.({ action: data.action, forceNavigation });
    });

    return { forceNavigation };
};
