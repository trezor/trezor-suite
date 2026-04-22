import { type RouteProp, useRoute } from '@react-navigation/native';

import { Text, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import {
    Screen,
    ScreenHeader,
    type YieldStackParamList,
    type YieldStackRoutes,
} from '@suite-native/navigation';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';
import { capitalizeFirstLetter } from '@trezor/utils';

import { YieldConsentsProviderCard } from '../components/YieldConsentsProviderCard';
import { useWorkInProgressAlert } from '../hooks/useWorkInProgressAlert';
import { useYieldOpportunityData } from '../hooks/useYieldOpportunityData';

const titleStyle = prepareNativeStyle(utils => ({
    marginBottom: utils.spacings.sp32,
}));

type RouteProps = RouteProp<YieldStackParamList, YieldStackRoutes.YieldConsents>;

export const YieldConsentsScreen = () => {
    const { applyStyle } = useNativeStyles();
    const route = useRoute<RouteProps>();
    const { yieldId } = route.params;
    const handleShowWorkInProgressAlert = useWorkInProgressAlert();
    const { vault, tokenSymbol } = useYieldOpportunityData({ yieldId });

    if (!vault || !tokenSymbol) {
        return;
    }

    const providerName = capitalizeFirstLetter(vault.providerId);

    return (
        <Screen header={<ScreenHeader closeActionType="back" />}>
            <VStack marginTop="sp16" spacing="sp16">
                <Text variant="headline-md" style={applyStyle(titleStyle)}>
                    <Translation id="earn.yieldConsentsScreen.title" />
                </Text>
                <YieldConsentsProviderCard
                    providerName={providerName}
                    tokenSymbol={tokenSymbol}
                    onConfirm={handleShowWorkInProgressAlert}
                />
            </VStack>
        </Screen>
    );
};
