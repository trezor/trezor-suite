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

    const handleGoBack = () => {
        // The authorization screens are in a stack navigator and when authorization is cancelled or succesfull, we want to
        // go back to previous (non-authorization) stack. This is achieved by navigating to first screen of current stack
        // and then going back to previous stack.
        navigation.popToTop();
        if (navigation.canGoBack()) {
            navigation.goBack();
        }
    };

    return { handleGoBack };
};
