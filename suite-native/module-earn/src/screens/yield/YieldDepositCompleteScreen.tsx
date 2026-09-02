import { useCallback, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';

import { type RouteProp, useNavigation, useRoute } from '@react-navigation/native';

import { events } from '@suite-common/analytics';
import { useServices } from '@suite-common/dependency-injection';
import { useDispatch } from '@suite-common/redux-utils';
import { getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import {
    type YieldRootState,
    selectYieldSessionByFlowKey,
    yieldActions,
} from '@suite-common/wallet-core';
import { selectNativeAnalyticsDep } from '@suite-native/analytics';
import { Text } from '@suite-native/atoms';
import { Translation, selectSupportedLanguageLocale } from '@suite-native/intl';
import {
    type StackNavigationProps,
    type YieldStackParamList,
    YieldStackRoutes,
    useNavigateToInitialScreen,
    useOverrideBackNavigation,
} from '@suite-native/navigation';

import { ApyDottedUnderline } from '../../components/earn/ApyDottedUnderline';
import { ApyValue } from '../../components/earn/ApyValue';
import { EarnCompleteScreenContent } from '../../components/earn/EarnCompleteScreenContent';
import { getYieldDepositCompleteRows } from '../../components/yield/YieldCompleteScreenPresets';
import { useYieldApyBreakdownAlert } from '../../hooks/yield/useYieldApyBreakdownAlert';
import { useYieldFlowData } from '../../hooks/yield/useYieldFlowData';
import { formatEarnTokenAmount } from '../../utils/earn/earnAmountUtils';

type RouteProps = RouteProp<YieldStackParamList, YieldStackRoutes.YieldDepositComplete>;
type NavigationProps = StackNavigationProps<
    YieldStackParamList,
    YieldStackRoutes.YieldDepositComplete
>;

export const YieldDepositCompleteScreen = () => {
    const route = useRoute<RouteProps>();
    const navigation = useNavigation<NavigationProps>();
    const dispatch = useDispatch();
    const navigateToInitialScreen = useNavigateToInitialScreen();
    const locale = useSelector(selectSupportedLanguageLocale);

    const yieldFlowData = useYieldFlowData(route.params);
    const { vault, account, apy, flowData, flowKey, resolutionStatus, tokenSymbol } = yieldFlowData;

    const session = useSelector((state: YieldRootState) =>
        selectYieldSessionByFlowKey(state, 'deposit', flowKey),
    );

    const { show: showYieldApyBreakdownAlert } = useYieldApyBreakdownAlert({ account, vault });
    const { analytics } = useServices(selectNativeAnalyticsDep);

    const handleExit = useCallback(() => {
        analytics.report({
            type: events.yieldNavigateEvent.name,
            payload: {
                action: 'continue',
                from: 'deposit-form',
                to: 'earn-dashboard',
                networkSymbol: account?.symbol,
                vaultId: vault?.id,
            },
        });

        if (flowKey) {
            dispatch(yieldActions.disposeSession({ flowType: 'deposit', flowKey }));
        }

        navigateToInitialScreen();
    }, [account?.symbol, analytics, dispatch, flowKey, navigateToInitialScreen, vault?.id]);

    useOverrideBackNavigation({ onNavigateBack: handleExit });

    useEffect(() => {
        if (resolutionStatus !== 'resolved') {
            return;
        }

        if (!session) {
            navigateToInitialScreen();

            return;
        }

        if (session.step !== 'complete') {
            navigation.replace(YieldStackRoutes.YieldDeposit, route.params);
        }
    }, [navigation, navigateToInitialScreen, resolutionStatus, route.params, session]);

    const rows = useMemo(() => {
        if (resolutionStatus !== 'resolved' || !session) {
            return [];
        }

        const receivedAmount = formatEarnTokenAmount({
            amount: session.result.completedReceiptAmount,
            locale,
            symbol: flowData.receiptToken.symbol,
        });

        const hasWrappedInput = !!session.result.wrappedAmount;
        const sentAmount = formatEarnTokenAmount({
            amount: session.result.completedAmount,
            locale,
            symbol: hasWrappedInput ? getNetworkDisplaySymbol(account.symbol) : tokenSymbol,
        });

        return getYieldDepositCompleteRows({
            accountSymbol: account.symbol,
            apyValue: (
                <ApyDottedUnderline onPress={showYieldApyBreakdownAlert}>
                    <Text variant="body-md" color="contentPrimary">
                        <ApyValue apy={apy} />
                    </Text>
                </ApyDottedUnderline>
            ),
            receivedAmount,
            receivedTokenContract: flowData.receiptToken.contractAddress ?? undefined,
            sentAmount,
            sentTokenContract: hasWrappedInput
                ? undefined
                : (flowData.token.contractAddress ?? undefined),
        });
    }, [
        showYieldApyBreakdownAlert,
        account,
        apy,
        flowData,
        locale,
        resolutionStatus,
        session,
        tokenSymbol,
    ]);

    if (resolutionStatus !== 'resolved' || session?.step !== 'complete') {
        return null;
    }

    return (
        <EarnCompleteScreenContent
            type="deposit"
            vaultId={vault.id}
            buttonTranslationId="earn.yieldCompleteScreen.backToOverview"
            onButtonPress={handleExit}
            rows={rows}
            title={<Translation id="earn.yieldDepositCompleteScreen.title" />}
            subtitle={<Translation id="earn.yieldDepositCompleteScreen.subtitle" />}
        />
    );
};
