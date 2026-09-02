import { useCallback } from 'react';

import { type RouteProp, useRoute } from '@react-navigation/native';

import { events } from '@suite-common/analytics';
import { useServices } from '@suite-common/dependency-injection';
import { selectNativeAnalyticsDep } from '@suite-native/analytics';
import { Translation } from '@suite-native/intl';
import {
    type RootStackParamList,
    type RootStackRoutes,
    Screen,
    ScreenHeader,
} from '@suite-native/navigation';

import { EarnInsufficientBalanceContent } from '../../components/earn/EarnInsufficientBalanceContent';
import { useNavigateBackAnalytics } from '../../hooks/earn/useNavigateBackAnalytics';
import { useYieldFlowData } from '../../hooks/yield/useYieldFlowData';

type RouteProps = RouteProp<RootStackParamList, RootStackRoutes.YieldInsufficientBalance>;

export const YieldInsufficientBalanceScreen = () => {
    const route = useRoute<RouteProps>();
    const yieldFlowData = useYieldFlowData(route.params);
    const { account, resolutionStatus, tokenSymbol, vault } = yieldFlowData;
    const { analytics } = useServices(selectNativeAnalyticsDep);
    const registerNavigateBackAnalytics = useNavigateBackAnalytics({
        type: events.yieldNavigateEvent.name,
        payload: {
            action: 'cancel',
            from: 'insufficient-balance-screen',
            to: 'insufficient-balance-screen',
            networkSymbol: account?.symbol,
            vaultId: vault?.id,
        },
    });

    const handleGetTokenPress = useCallback(() => {
        analytics.report({
            type: events.yieldInteractionEvent.name,
            payload: {
                element: 'insufficient-funds-banner',
                networkSymbol: account?.symbol,
                vaultId: vault?.id,
            },
        });
        registerNavigateBackAnalytics();
    }, [account?.symbol, analytics, registerNavigateBackAnalytics, vault?.id]);

    if (resolutionStatus !== 'resolved') {
        return null;
    }

    return (
        <Screen header={<ScreenHeader closeActionType="back" />}>
            <EarnInsufficientBalanceContent
                title={
                    <Translation
                        id="earn.yieldInsufficientBalance.title"
                        values={{ tokenSymbol }}
                    />
                }
                subtitle={
                    <Translation
                        id="earn.yieldInsufficientBalance.subtitle"
                        values={{ tokenSymbol }}
                    />
                }
                primaryButtonContent={
                    <Translation
                        id="earn.yieldInsufficientBalance.getButton"
                        values={{ tokenSymbol }}
                    />
                }
                onPrimaryButtonPress={handleGetTokenPress}
            />
        </Screen>
    );
};
