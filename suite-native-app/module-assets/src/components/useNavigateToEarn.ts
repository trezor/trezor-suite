import { CommonActions, type RouteProp, useNavigation, useRoute } from '@react-navigation/native';

import { events, injectNativeAnalytics } from '@suite-native/analytics';
import {
    AppTabsRoutes,
    type AssetsStackParamList,
    type AssetsStackRoutes,
    EarnStackRoutes,
    type RootStackParamList,
    RootStackRoutes,
    type StackNavigationProps,
} from '@suite-native/navigation';
import { useServices } from '@trezor/dependency-injection';

type NavigationProps = StackNavigationProps<RootStackParamList, RootStackRoutes.AppTabs>;

export const useNavigateToEarn = () => {
    const { networkSymbol } =
        useRoute<RouteProp<AssetsStackParamList, AssetsStackRoutes.AssetDetail>>().params;
    const navigation = useNavigation<NavigationProps>();
    const { analytics } = useServices(injectNativeAnalytics);

    return () => {
        analytics.report({
            type: events.navigateFlowEvent.name,
            payload: {
                action: 'navigate',
                type: 'earn',
                from: 'asset-detail',
                networkSymbol,
            },
        });
        // Reset to a single AppTabs route instead of stacking another navigator or presenting Earn
        // with a back transition.
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
};
