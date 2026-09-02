import { useCallback, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';

import { type RouteProp, useNavigation, useRoute } from '@react-navigation/native';

import { events } from '@suite-common/analytics';
import { useServices } from '@suite-common/dependency-injection';
import { useDispatch } from '@suite-common/redux-utils';
import {
    type YieldRootState,
    getYieldWithdrawCompletedValues,
    selectYieldSessionByFlowKey,
    yieldActions,
} from '@suite-common/wallet-core';
import { selectNativeAnalyticsDep } from '@suite-native/analytics';
import { Translation, selectSupportedLanguageLocale } from '@suite-native/intl';
import {
    type StackNavigationProps,
    type YieldStackParamList,
    YieldStackRoutes,
    useNavigateToInitialScreen,
} from '@suite-native/navigation';

import { EarnCompleteScreenContent } from '../components/EarnCompleteScreenContent';
import { getYieldWithdrawCompleteRows } from '../components/YieldCompleteScreenPresets';
import { useYieldFlowData } from '../hooks/useYieldFlowData';
import { formatEarnTokenAmount } from '../utils/earnAmountUtils';

type RouteProps = RouteProp<YieldStackParamList, YieldStackRoutes.YieldWithdrawComplete>;
type NavigationProps = StackNavigationProps<
    YieldStackParamList,
    YieldStackRoutes.YieldWithdrawComplete
>;

export const YieldWithdrawCompleteScreen = () => {
    const route = useRoute<RouteProps>();
    const navigation = useNavigation<NavigationProps>();
    const dispatch = useDispatch();
    const navigateToInitialScreen = useNavigateToInitialScreen();
    const locale = useSelector(selectSupportedLanguageLocale);

    const yieldFlowData = useYieldFlowData(route.params);
    const { account, flowKey, receiptToken, resolutionStatus, token, vault } = yieldFlowData;

    const flowType = route.params.withdrawFlowType ?? 'withdraw';
    const session = useSelector((state: YieldRootState) =>
        selectYieldSessionByFlowKey(state, flowType, flowKey),
    );
    const { analytics } = useServices(selectNativeAnalyticsDep);

    const handleExit = useCallback(() => {
        analytics.report({
            type: events.yieldNavigateEvent.name,
            payload: {
                action: 'continue',
                from: 'withdraw-form',
                to: 'earn-dashboard',
                networkSymbol: account?.symbol,
                vaultId: vault?.id,
            },
        });

        if (flowKey) {
            dispatch(yieldActions.disposeSession({ flowType, flowKey }));
        }

        navigateToInitialScreen();
    }, [
        account?.symbol,
        analytics,
        dispatch,
        flowKey,
        flowType,
        navigateToInitialScreen,
        vault?.id,
    ]);

    useEffect(() => {
        if (resolutionStatus !== 'resolved') {
            return;
        }

        if (!session) {
            navigateToInitialScreen();

            return;
        }

        if (session.step !== 'complete') {
            navigation.replace(YieldStackRoutes.YieldWithdraw, route.params);
        }
    }, [navigation, navigateToInitialScreen, resolutionStatus, route.params, session]);

    const rows = useMemo(() => {
        if (resolutionStatus !== 'resolved' || !session) {
            return [];
        }

        const { completedAmount, unwrappedAmount } = session.result;

        const { input, output } = getYieldWithdrawCompletedValues({
            networkSymbol: account.symbol,
            flowType,
            completedAmount,
            unwrappedAmount,
            token,
            receiptToken,
            pricePerShareState: vault.state?.pricePerShareState,
        });

        return getYieldWithdrawCompleteRows({
            accountSymbol: account.symbol,
            receivedAmount: formatEarnTokenAmount({
                amount: output.amount,
                locale,
                symbol: output.token.symbol,
            }),
            receivedTokenContract: output.token.contractAddress ?? undefined,
            withdrawalAmount: formatEarnTokenAmount({
                amount: input.amount,
                locale,
                symbol: input.token.symbol,
            }),
            withdrawalTokenContract: input.token.contractAddress ?? undefined,
        });
    }, [account, flowType, locale, receiptToken, resolutionStatus, session, token, vault]);

    if (resolutionStatus !== 'resolved' || session?.step !== 'complete') {
        return null;
    }

    return (
        <EarnCompleteScreenContent
            type="withdraw"
            vaultId={vault.id}
            buttonTranslationId="earn.yieldCompleteScreen.backToOverview"
            onButtonPress={handleExit}
            rows={rows}
            title={<Translation id="earn.yieldWithdrawCompleteScreen.title" />}
            subtitle={<Translation id="earn.yieldWithdrawCompleteScreen.subtitle" />}
        />
    );
};
