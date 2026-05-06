import { type RouteProp, useNavigation, useRoute } from '@react-navigation/native';

import { Text, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import {
    Screen,
    ScreenHeader,
    type StackNavigationProps,
    type YieldStackParamList,
    YieldStackRoutes,
} from '@suite-native/navigation';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { YieldConsentsProviderCard } from '../components/YieldConsentsProviderCard';
import { useResolvedYieldFlowData } from '../hooks/useResolvedYieldFlowData';

const titleStyle = prepareNativeStyle(utils => ({
    marginBottom: utils.spacings.sp32,
}));

type RouteProps = RouteProp<YieldStackParamList, YieldStackRoutes.YieldConsents>;
type NavigationProps = StackNavigationProps<YieldStackParamList, YieldStackRoutes.YieldConsents>;

export const YieldConsentsScreen = () => {
    const { applyStyle } = useNativeStyles();
    const navigation = useNavigation<NavigationProps>();
    const route = useRoute<RouteProps>();
    const { providerName, tokenSymbol, resolutionStatus } = useResolvedYieldFlowData(route.params);

    const handleNavigateToYieldSupplyFlow = () => {
        navigation.navigate(YieldStackRoutes.YieldSupplyFlow, route.params);
    };

    if (resolutionStatus !== 'resolved') {
        return;
    }

    return (
        <Screen header={<ScreenHeader closeActionType="back" />}>
            <VStack marginTop="sp16" spacing="sp16">
                <Text variant="headline-md" style={applyStyle(titleStyle)}>
                    <Translation id="earn.yieldConsentsScreen.title" />
                </Text>
                <YieldConsentsProviderCard
                    providerName={providerName}
                    tokenSymbol={tokenSymbol}
                    onConfirm={handleNavigateToYieldSupplyFlow}
                />
            </VStack>
        </Screen>
    );
};
