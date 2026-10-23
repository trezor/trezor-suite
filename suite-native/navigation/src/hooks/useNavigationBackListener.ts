import { useEffect, useRef } from 'react';

import { type NavigationAction, useNavigation } from '@react-navigation/native';

const BACK_ACTION_TYPES = ['GO_BACK', 'POP'];

type NavigationBackListenerProps = {
    onBack: (action: NavigationAction) => void;
};

/**
 * Runs a side effect when the screen is removed by back navigation, without blocking it.
 * Unlike `useNavigationRemoveActionInterceptor`, the removal is not prevented, so the iOS swipe-back
 * gesture does not bounce the screen back before it is dismissed.
 *
 * `GO_BACK` handles standard back navigation, `POP` handles native-stack dismissals (iOS swipe-back).
 */
export const useNavigationBackListener = ({ onBack }: NavigationBackListenerProps) => {
    const navigation = useNavigation();
    const onBackRef = useRef(onBack);
    onBackRef.current = onBack;

    useEffect(
        () =>
            navigation.addListener('beforeRemove', ({ data }) => {
                if (BACK_ACTION_TYPES.includes(data.action.type)) {
                    onBackRef.current(data.action);
                }
            }),
        [navigation],
    );
};
