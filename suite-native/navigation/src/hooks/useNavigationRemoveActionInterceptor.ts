import { type NavigationAction, useNavigation, usePreventRemove } from '@react-navigation/native';
export type NavigationActionType = 'GO_BACK' | 'POP' | 'POP_TO_TOP' | 'PUSH' | 'REPLACE' | 'POP_TO';

type NavigationRemoveActionInterceptorProps = {
    isEnabled?: boolean;
    actionTypesToIntercept?: NavigationActionType[];
    onInterceptedAction?: (action: NavigationAction) => void;
    onPassThroughAction?: (action: NavigationAction) => void;
};

/**
 * All navigation removals are initially prevented by `usePreventRemove`.
 * Selected action types remain intercepted; all others are automatically dispatched after calling
 * `onPassThroughAction`.
 *
 * @param isEnabled Whether navigation remove actions should be prevented.
 * @param actionTypesToIntercept Navigation action types to intercept.
 * `GO_BACK` handles standard back navigation.
 * `POP` handles iOS swipe-back gestures.
 * @param onInterceptedAction Called with the intercepted navigation action.
 * @param onPassThroughAction Called before dispatching a non-intercepted navigation action.
 */
export const useNavigationRemoveActionInterceptor = ({
    isEnabled = true,
    actionTypesToIntercept = ['GO_BACK', 'POP'],
    onInterceptedAction,
    onPassThroughAction,
}: NavigationRemoveActionInterceptorProps) => {
    const navigation = useNavigation();

    usePreventRemove(isEnabled, ({ data }) => {
        if (actionTypesToIntercept.includes(data.action.type as NavigationActionType)) {
            onInterceptedAction?.(data.action);

            return;
        }

        onPassThroughAction?.(data.action);
        navigation.dispatch(data.action);
    });
};
