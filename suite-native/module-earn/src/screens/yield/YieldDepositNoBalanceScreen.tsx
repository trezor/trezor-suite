import { useEffect, useRef } from 'react';

import { type RouteProp, useIsFocused, useRoute } from '@react-navigation/native';

import { events } from '@suite-common/analytics';
import { yieldFlowDataToTokenMetadataSources } from '@suite-common/earn-stablecoin';
import { TokenMetadataProvider } from '@suite-common/token';
import { hasYieldDepositableBalance } from '@suite-common/wallet-core';
import { injectNativeAnalytics } from '@suite-native/analytics';
import { AssetSymbol } from '@suite-native/assets';
import { useYieldFlowData } from '@suite-native/earn';
import { Translation } from '@suite-native/intl';
import {
    Screen,
    type YieldStackParamList,
    type YieldStackRoutes,
    useNavigateToInitialScreen,
} from '@suite-native/navigation';
import { useServices } from '@trezor/dependency-injection';

import { EarnNoBalanceCard } from '../../components/earn/EarnNoBalanceCard';
import { EarnNoBalanceFooter } from '../../components/earn/EarnNoBalanceFooter';
import { YieldFlowScreenHeader } from '../../components/yield/YieldFlowScreenHeader';
import {
    type EarnNoBalanceAction,
    useEarnNoBalanceActions,
} from '../../hooks/earn/useEarnNoBalanceActions';
import { useNavigateBackAnalytics } from '../../hooks/earn/useNavigateBackAnalytics';
import { useRefreshWrappedNativeTokenOnFocus } from '../../hooks/yield/useRefreshWrappedNativeTokenOnFocus';
import { useStartYieldDepositFlow } from '../../hooks/yield/useStartYieldDepositFlow';

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
        vault,
        vaultTokenName,
    } = yieldFlowData;

    const { handleStartYieldDepositFlow } = useStartYieldDepositFlow({
        flowData,
        flowKey,
        isWrappedNativeVault,
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

    const depositSymbol = (
        <AssetSymbol
            networkSymbol={account.symbol}
            contractAddress={route.params.tokenContract}
            isWrappedNativeShownAsNative
        />
    );

    return (
        <TokenMetadataProvider sources={yieldFlowDataToTokenMetadataSources(yieldFlowData)}>
            <Screen
                header={
                    <YieldFlowScreenHeader
                        account={account}
                        closeAction={navigateToInitialScreen}
                        title={vaultTokenName}
                        tokenContract={route.params.tokenContract}
                    />
                }
                footer={
                    <EarnNoBalanceFooter
                        networkSymbol={account.symbol}
                        contractAddress={
                            isWrappedNativeVault ? undefined : route.params.tokenContract
                        }
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
        </TokenMetadataProvider>
    );
};
