import { type NavigationAction, useNavigation, usePreventRemove } from '@react-navigation/native';

type ActionType = 'GO_BACK' | 'POP';

type PreventNavigationRemoveProps = {
    shouldPrevent?: boolean;
    actionTypes?: ActionType[];
    onPreventedRemove?: (action: NavigationAction) => void;
    onAllowedRemove?: (action: NavigationAction) => void;
};

/**
 * Prevents selected navigation remove actions.
 *
 * @param shouldPrevent Whether removing the screen should be prevented.
 * @param actionTypes Navigation action types to intercept.
 * `GO_BACK` handles standard back navigation.
 * `POP` handles iOS swipe-back gestures.
 * @param onPreventedRemove Called with the intercepted navigation action.
 * @param onAllowedRemove Called before dispatching a non-intercepted navigation action.
 */
export const usePreventNavigationRemove = ({
    shouldPrevent = true,
    actionTypes = ['GO_BACK', 'POP'],
    onPreventedRemove,
    onAllowedRemove,
}: PreventNavigationRemoveProps) => {
    const navigation = useNavigation();

    usePreventRemove(shouldPrevent, ({ data }) => {
        if (actionTypes.includes(data.action.type as ActionType)) {
            onPreventedRemove?.(data.action);

            return;
        }

        onAllowedRemove?.(data.action);
        navigation.dispatch(data.action);
    });
};
