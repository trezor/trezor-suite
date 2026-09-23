import { type NavigationAction, useNavigation, usePreventRemove } from '@react-navigation/native';

import {
    type NavigationRemoveActionTypes,
    matchesNavigationRemoveAction,
} from '../navigationRemove';

type OnBlockedParams = {
    action: NavigationAction;
    /** Resumes the original action once, without triggering this route's guard again. */
    continueNavigation: () => void;
};

export type UseNavigationRemoveGuardParams = {
    /** Defaults to true. Disabling the guard also disables its callback. */
    isEnabled?: boolean;
    /** Explicitly select removal actions to block; an empty list blocks none. */
    actionTypes: NavigationRemoveActionTypes;
    /** Returning or resolving leaves navigation blocked. Omit to block unconditionally. */
    onBlocked?: (params: OnBlockedParams) => void | Promise<void>;
};

/**
 * Blocks selected screen-removal attempts until continueNavigation is called explicitly.
 * Other removal actions continue automatically.
 */
export const useNavigationRemoveGuard = ({
    isEnabled = true,
    actionTypes,
    onBlocked,
}: UseNavigationRemoveGuardParams) => {
    const navigation = useNavigation();

    usePreventRemove(isEnabled, ({ data }) => {
        if (!matchesNavigationRemoveAction(actionTypes, data.action)) {
            navigation.dispatch(data.action);

            return;
        }

        let hasContinued = false;

        onBlocked?.({
            action: data.action,
            continueNavigation: () => {
                if (hasContinued) {
                    return;
                }

                hasContinued = true;
                navigation.dispatch(data.action);
            },
        });
    });
};
