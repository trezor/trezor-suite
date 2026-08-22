import { type RouteProp, useRoute } from '@react-navigation/native';

import { events } from '@suite-common/analytics';
import { useServices } from '@suite-common/dependency-injection';
import { selectNativeAnalyticsDep } from '@suite-native/analytics';
import { Text, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import {
    Screen,
    ScreenHeader,
    type YieldStackParamList,
    type YieldStackRoutes,
} from '@suite-native/navigation';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { YieldConsentsProviderCard } from '../components/YieldConsentsProviderCard';
import { useNavigateBackAnalytics } from '../hooks/useNavigateBackAnalytics';
import { useStartYieldDepositFlow } from '../hooks/useStartYieldDepositFlow';
import { useYieldFlowData } from '../hooks/useYieldFlowData';

const titleStyle = prepareNativeStyle(utils => ({
    marginBottom: utils.spacings.sp32,
}));

type RouteProps = RouteProp<YieldStackParamList, YieldStackRoutes.YieldConsents>;

export const YieldConsentsScreen = () => {
    const { applyStyle } = useNativeStyles();
    const route = useRoute<RouteProps>();
    const { analytics } = useServices(selectNativeAnalyticsDep);

    const yieldFlowData = useYieldFlowData(route.params);

    const {
        account,
        flowData,
        flowKey,
        providerName,
        tokenSymbol,
        vault,
        resolutionStatus,
        wrappedNativeSymbol,
    } = yieldFlowData;

    const { handleStartYieldDepositFlow, isStartingDepositFlow } = useStartYieldDepositFlow({
        flowData,
        flowKey,
        routeParams: route.params,
    });

    const registerNavigateBackAnalytics = useNavigateBackAnalytics({
        type: events.yieldNavigateEvent.name,
        payload: {
            action: 'cancel',
            from: 'deposit-legal-modal',
            to: 'deposit-legal-modal',
            networkSymbol: account?.symbol,
            vaultId: vault?.id,
        },
    });

    const handleConfirmConsents = () => {
        void handleStartYieldDepositFlow().then(hasStartedDepositFlow => {
            if (!hasStartedDepositFlow) {
                return;
            }

            analytics.report({
                type: events.yieldNavigateEvent.name,
                payload: {
                    action: 'continue',
                    from: 'deposit-legal-modal',
                    to: 'deposit-form',
                    networkSymbol: account?.symbol,
                    vaultId: vault?.id,
                },
            });
            registerNavigateBackAnalytics();
        });
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
                    tokenSymbol={wrappedNativeSymbol ?? tokenSymbol}
                    onConfirm={handleConfirmConsents}
                    isConfirmLoading={isStartingDepositFlow}
                />
            </VStack>
        </Screen>
    );
};
