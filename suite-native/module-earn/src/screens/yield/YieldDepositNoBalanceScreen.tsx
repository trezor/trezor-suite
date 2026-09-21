import { useEffect, useRef } from 'react';

import { type RouteProp, useIsFocused, useRoute } from '@react-navigation/native';

import { events } from '@suite-common/analytics';
import { useServices } from '@suite-common/dependency-injection';
import { injectNativeAnalytics } from '@suite-native/analytics';
import { Translation } from '@suite-native/intl';
import {
    Screen,
    type YieldStackParamList,
    type YieldStackRoutes,
    useNavigateToInitialScreen,
} from '@suite-native/navigation';

import { EarnNoBalanceCard } from '../../components/earn/EarnNoBalanceCard';
import { EarnNoBalanceFooter } from '../../components/earn/EarnNoBalanceFooter';
import { YieldDepositFlowScreenHeader } from '../../components/yield/YieldDepositFlowScreenHeader';
import {
    type EarnNoBalanceAction,
    useEarnNoBalanceActions,
} from '../../hooks/earn/useEarnNoBalanceActions';
import { useNavigateBackAnalytics } from '../../hooks/earn/useNavigateBackAnalytics';
import { useRefreshWrappedNativeTokenOnFocus } from '../../hooks/yield/useRefreshWrappedNativeTokenOnFocus';
import { useStartYieldDepositFlow } from '../../hooks/yield/useStartYieldDepositFlow';
import { useYieldFlowData } from '../../hooks/yield/useYieldFlowData';
import { hasYieldDepositableBalance } from '../../utils/earn/contractTokenBalanceUtils';

type RouteProps = RouteProp<YieldStackParamList, YieldStackRoutes.YieldDepositNoBalance>;

export const YieldDepositNoBalanceScreen = () => {
    const route = useRoute<RouteProps>();
    const isFocused = useIsFocused();
    const navigateToInitialScreen = useNavigateToInitialScreen();
    const { analytics } = useServices(injectNativeAnalytics);

    const yieldFlowData = useYieldFlowData(route.params);
    const {
        account,
        apy,
        flowData,
        flowKey,
        isWrappedNativeVault,
        resolutionStatus,
        token,
        tokenSymbol,
        vault,
        vaultTokenName,
        wrappedNativeSymbol,
    } = yieldFlowData;

    const { handleStartYieldDepositFlow } = useStartYieldDepositFlow({
        flowData,
        flowKey,
        routeParams: route.params,
        shouldReplaceRoute: true,
    });
    const hasRestartedFlowRef = useRef(false);

    useRefreshWrappedNativeTokenOnFocus({
        accountKey: account?.key,
        isEnabled: isWrappedNativeVault,
    });

    useNavigateBackAnalytics({
        type: events.yieldNavigateEvent.name,
        payload: {
            action: 'cancel',
            from: 'insufficient-balance-screen',
            to: 'insufficient-balance-screen',
            networkSymbol: account?.symbol,
            vaultId: vault?.id,
        },
    });

    const reportActionPress = (action: EarnNoBalanceAction) => {
        analytics.report({
            type: events.yieldInteractionEvent.name,
            payload: {
                element: 'insufficient-funds-banner',
                value: action,
                networkSymbol: account?.symbol,
                vaultId: vault?.id,
            },
        });
    };

    const { handleBuyPress, handleReceivePress, handleSwapPress } = useEarnNoBalanceActions({
        accountKey: route.params.accountKey,
        tokenContract: isWrappedNativeVault ? undefined : route.params.tokenContract,
        onActionPress: reportActionPress,
    });

    const hasDepositableBalance =
        account !== null &&
        hasYieldDepositableBalance({
            account,
            vaultTokenContract: token?.contractAddress ?? null,
        });

    useEffect(() => {
        if (!isFocused || !hasDepositableBalance || hasRestartedFlowRef.current) {
            return;
        }

        hasRestartedFlowRef.current = true;
        void handleStartYieldDepositFlow().then(destination => {
            if (destination !== 'deposit-form') {
                hasRestartedFlowRef.current = false;

                return;
            }

            analytics.report({
                type: events.yieldNavigateEvent.name,
                payload: {
                    action: 'continue',
                    from: 'insufficient-balance-screen',
                    to: destination,
                    networkSymbol: account?.symbol,
                    vaultId: vault?.id,
                },
            });
        });
    }, [
        account?.symbol,
        analytics,
        handleStartYieldDepositFlow,
        hasDepositableBalance,
        isFocused,
        vault?.id,
    ]);

    if (resolutionStatus !== 'resolved') {
        return null;
    }

    const depositSymbol = wrappedNativeSymbol ?? tokenSymbol;

    return (
        <Screen
            header={
                <YieldDepositFlowScreenHeader
                    account={account}
                    closeAction={navigateToInitialScreen}
                    title={vaultTokenName}
                    tokenContract={route.params.tokenContract}
                />
            }
            footer={
                <EarnNoBalanceFooter
                    displaySymbol={depositSymbol}
                    onBuyPress={handleBuyPress}
                    onReceivePress={handleReceivePress}
                    onSwapPress={handleSwapPress}
                />
            }
        >
            <EarnNoBalanceCard
                apy={apy}
                title={
                    <Translation
                        id="earn.noBalance.yield.title"
                        values={{ tokenSymbol: depositSymbol }}
                    />
                }
                subtitle={
                    <Translation
                        id="earn.noBalance.yield.subtitle"
                        values={{ tokenSymbol: depositSymbol }}
                    />
                }
            />
        </Screen>
    );
};
