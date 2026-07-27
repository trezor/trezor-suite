import { type NavigationAction, useNavigation, usePreventRemove } from '@react-navigation/native';

type ActionType = 'GO_BACK' | 'POP';

type NavigationRemoveActionInterceptorProps = {
    isEnabled?: boolean;
    interceptedActionTypes?: ActionType[];
    onInterceptedAction?: (action: NavigationAction) => void;
    onAllowedAction?: (action: NavigationAction) => void;
};

/**
 * Intercepts selected navigation remove actions.
 *
 * @param isEnabled Whether navigation remove actions should be intercepted.
 * @param interceptedActionTypes Navigation action types to intercept.
 * `GO_BACK` handles standard back navigation.
 * `POP` handles iOS swipe-back gestures.
 * @param onInterceptedAction Called with the intercepted navigation action.
 * @param onAllowedAction Called before dispatching a non-intercepted navigation action.
 */
export const useNavigationRemoveActionInterceptor = ({
    isEnabled = true,
    interceptedActionTypes = ['GO_BACK', 'POP'],
    onInterceptedAction,
    onAllowedAction,
}: NavigationRemoveActionInterceptorProps) => {
    const navigation = useNavigation();

    usePreventRemove(isEnabled, ({ data }) => {
        if (interceptedActionTypes.includes(data.action.type as ActionType)) {
            onInterceptedAction?.(data.action);

            return;
        }

        onAllowedAction?.(data.action);
        navigation.dispatch(data.action);
    });
};
