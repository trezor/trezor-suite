import { type NavigationAction, useNavigation, usePreventRemove } from '@react-navigation/native';

type ActionType = 'GO_BACK' | 'POP';

type PreventNavigationRemoveProps = {
    shouldPrevent?: boolean;
    actionTypes?: ActionType[];
    onNavigateBack?: (action?: NavigationAction) => void;
    onSuccessfulRemove?: () => void;
};

/**
 * Prevents selected navigation remove actions.
 *
 * @param shouldPrevent Whether removing the screen should be prevented.
 * @param actionTypes Navigation action types to intercept.
 * `GO_BACK` handles standard back navigation.
 * `POP` handles iOS swipe-back gestures.
 * @param onNavigateBack Called with the intercepted navigation action.
 */
export const usePreventNavigationRemove = ({
    shouldPrevent = true,
    actionTypes = ['GO_BACK', 'POP'],
    onNavigateBack,
    onSuccessfulRemove,
}: PreventNavigationRemoveProps) => {
    const navigation = useNavigation();

    usePreventRemove(shouldPrevent, ({ data }) => {
        if (actionTypes.includes(data.action.type as ActionType)) {
            onNavigateBack?.(data.action);

            return;
        }

        onSuccessfulRemove?.();
        navigation.dispatch(data.action);
    });
};
