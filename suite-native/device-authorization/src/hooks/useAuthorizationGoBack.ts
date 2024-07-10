import { useNavigation } from '@react-navigation/native';

import {
    AuthorizeDeviceStackParamList,
    AuthorizeDeviceStackRoutes,
    RootStackParamList,
    StackToTabCompositeProps,
} from '@suite-native/navigation';

type NavigationProp = StackToTabCompositeProps<
    AuthorizeDeviceStackParamList,
    AuthorizeDeviceStackRoutes,
    RootStackParamList
>;

export const useAuthorizationGoBack = () => {
    const navigation = useNavigation<NavigationProp>();

    // The authorization screens are in a stack navigator and when authorization is cancelled or succesfull, we want to
    // go back to previous (non-authorization) stack. This is achieved by navigating to first screen of current stack
    // and then going back to previous stack.
    const handleGoBack = () => {
        // popToTop is used to empty the stack as a prerequisite to `navigation.goBack`
        // If there is more routes than 1, it will empty the stack, but if there is single route (current one),
        // popToTop will go to previous stack instead, which we don't want since this is handled by `navigation.goBack` below
        if (navigation.getState().routes.length > 1) {
            navigation.popToTop();
        }
        if (navigation.canGoBack()) {
            navigation.goBack();
        }
    };

    return { handleGoBack };
};
