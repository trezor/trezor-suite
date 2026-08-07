import { useCallback, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { type RouteProp, useNavigation, useRoute } from '@react-navigation/native';

import { events } from '@suite-common/analytics';
import { useServices } from '@suite-common/dependency-injection';
import { buildUserFeedbackData, sendFeedbackAction } from '@suite-common/feedback';
import { useFormatters } from '@suite-common/formatters';
import { getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import {
    type StablecoinYieldRootState,
    getConvertedOutputTokenBalanceToInputTokenAmount,
    selectStablecoinYieldSessionByFlowKey,
    stablecoinYieldActions,
} from '@suite-common/wallet-core';
import { toTokenSymbol } from '@suite-common/wallet-types';
import { selectNativeAnalyticsDep } from '@suite-native/analytics';
import { useFeedbackForm } from '@suite-native/feature-feedback';
import { Translation } from '@suite-native/intl';
import {
    type StackNavigationProps,
    type YieldStackParamList,
    YieldStackRoutes,
    useNavigateToInitialScreen,
} from '@suite-native/navigation';

import { YieldCompleteScreenContent } from '../components/YieldCompleteScreenContent';
import { getYieldWithdrawCompleteRows } from '../components/YieldCompleteScreenPresets';
import { useResolvedYieldFlowData } from '../hooks/useResolvedYieldFlowData';

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
    const { CryptoAmountFormatter } = useFormatters();
    const { account, flowKey, resolutionStatus, vault } = useResolvedYieldFlowData(route.params);
    const flowType = route.params.withdrawFlowType ?? 'withdraw';
    const session = useSelector((state: StablecoinYieldRootState) =>
        selectStablecoinYieldSessionByFlowKey(state, flowType, flowKey),
    );
    const isSharesInput = flowType === 'redeem';
    const { analytics } = useServices(selectNativeAnalyticsDep);

    const feedbackForm = useFeedbackForm();

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
            dispatch(stablecoinYieldActions.disposeSession({ flowType, flowKey }));
        }

        if (feedbackForm.isValid) {
            const userData = buildUserFeedbackData();

            const { rating, description } = feedbackForm;

            dispatch(
                sendFeedbackAction({
                    type: 'SUGGESTION',
                    payload: {
                        category: 'yield',
                        feature: 'withdraw',
                        description,
                        rating,
                        ...userData,
                    },
                }),
            );
        }

        navigateToInitialScreen();
    }, [
        feedbackForm,
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
        if (resolutionStatus !== 'resolved' || !session || !vault.outputToken) {
            return [];
        }

        const { completedAmount, unwrappedAmount } = session.result;

        const hasUnwrappedOutput = unwrappedAmount !== null;
        const underlyingSymbol = hasUnwrappedOutput
            ? toTokenSymbol(getNetworkDisplaySymbol(account.symbol))
            : toTokenSymbol(vault.token.symbol);
        const vaultTokenSymbol = toTokenSymbol(vault.outputToken.symbol);
        const withdrawnUnderlyingAmount = isSharesInput
            ? getConvertedOutputTokenBalanceToInputTokenAmount({
                  networkSymbol: account.symbol,
                  token: vault.token,
                  outputToken: vault.outputToken,
                  outputTokenBalance: completedAmount,
                  pricePerShareState: vault.state?.pricePerShareState,
              })
            : completedAmount;
        const receivedUnderlyingAmount = unwrappedAmount ?? withdrawnUnderlyingAmount;

        const receivedAmount = CryptoAmountFormatter.format(receivedUnderlyingAmount, {
            symbol: underlyingSymbol,
            isBalance: true,
            withSymbol: true,
            isEllipsisAppended: false,
            maxDisplayedDecimals: 8,
        });

        const withdrawalAmount = isSharesInput
            ? CryptoAmountFormatter.format(completedAmount, {
                  symbol: vaultTokenSymbol,
                  isBalance: true,
                  withSymbol: true,
                  isEllipsisAppended: false,
                  maxDisplayedDecimals: 8,
              })
            : undefined;

        return getYieldWithdrawCompleteRows({
            accountSymbol: account.symbol,
            receivedAmount,
            receivedTokenContract: hasUnwrappedOutput
                ? undefined
                : (vault.token.address ?? undefined),
            withdrawalAmount,
            withdrawalTokenContract: vault.outputToken.address ?? undefined,
        });
    }, [CryptoAmountFormatter, account, isSharesInput, resolutionStatus, session, vault]);

    if (resolutionStatus !== 'resolved' || session?.step !== 'complete') {
        return null;
    }

    return (
        <YieldCompleteScreenContent
            buttonTranslationId={
                feedbackForm.isValid
                    ? 'earn.yieldCompleteScreen.sendAndBackToOverview'
                    : 'earn.yieldCompleteScreen.backToOverview'
            }
            onButtonPress={handleExit}
            rows={rows}
            title={<Translation id="earn.yieldWithdrawCompleteScreen.title" />}
            subtitle={<Translation id="earn.yieldWithdrawCompleteScreen.subtitle" />}
            feedbackForm={feedbackForm}
        />
    );
};
