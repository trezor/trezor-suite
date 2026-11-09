import { useCallback } from 'react';

import { StackActions, useNavigation } from '@react-navigation/native';

// Trading flow screens live in a nested stack, where popToTop would only rewind that stack.
// The action targets the parent stack explicitly, because screens with a remove interceptor
// re-dispatch it from their own nested navigation once the removal is allowed.
export const useCloseTradingFlow = () => {
    const navigation = useNavigation();

    return useCallback(() => {
        const parentNavigation = navigation.getParent();

        parentNavigation?.dispatch({
            ...StackActions.popToTop(),
            target: parentNavigation.getState().key,
        });
    }, [navigation]);
};
