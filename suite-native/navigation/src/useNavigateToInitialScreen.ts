import { useCallback } from 'react';

import { ParamListBase, useNavigation } from '@react-navigation/native';

import { StackToTabCompositeProps } from './index';

type NavigationProp = StackToTabCompositeProps<ParamListBase, string, ParamListBase>;

export const useNavigateToInitialScreen = () => {
    const navigation = useNavigation<NavigationProp>();

    // Some flows use their own stack navigator and once they are finished, we want to return
    // to the initial screen. This is achieved by navigating to the first screen of the current
    // stack and then going back.
    return useCallback(() => {
        // If there is more than 1 route, popToTop() will empty the stack. However, if there is
        // only a single route (the current one), popToTop() will go to the previous stack instead.
        // That's why we have to combine both popToTop() and goBack().
        if (navigation.getState().routes.length > 1) {
            navigation.popToTop();
        }
        if (navigation.canGoBack()) {
            navigation.goBack();
        }
    }, [navigation]);
};
