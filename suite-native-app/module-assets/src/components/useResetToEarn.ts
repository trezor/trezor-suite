import { CommonActions, useNavigation } from '@react-navigation/native';

import {
    AppTabsRoutes,
    EarnStackRoutes,
    type RootStackParamList,
    RootStackRoutes,
    type StackNavigationProps,
} from '@suite-native/navigation';

type NavigationProps = StackNavigationProps<RootStackParamList, RootStackRoutes.AppTabs>;

export const useResetToEarn = () => {
    const navigation = useNavigation<NavigationProps>();

    // Reset to a single AppTabs route instead of stacking another navigator or presenting Earn
    // with a back transition.
    return () =>
        navigation.dispatch(
            CommonActions.reset({
                index: 0,
                routes: [
                    {
                        name: RootStackRoutes.AppTabs,
                        params: {
                            screen: AppTabsRoutes.EarnStack,
                            params: { screen: EarnStackRoutes.Earn },
                        },
                    },
                ],
            }),
        );
};
