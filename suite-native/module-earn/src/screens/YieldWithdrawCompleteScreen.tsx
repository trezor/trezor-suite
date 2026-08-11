import { useCallback, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { type RouteProp, useNavigation, useRoute } from '@react-navigation/native';

import { events } from '@suite-common/analytics';
import { useServices } from '@suite-common/dependency-injection';
import { buildUserFeedbackData, sendFeedbackAction } from '@suite-common/feedback';
import {
    type StablecoinYieldRootState,
    getYieldWithdrawCompletedValues,
    selectStablecoinYieldSessionByFlowKey,
    stablecoinYieldActions,
} from '@suite-common/wallet-core';
import { selectNativeAnalyticsDep } from '@suite-native/analytics';
import { useFeedbackForm } from '@suite-native/feature-feedback';
import { Translation, selectSupportedLanguageLocale } from '@suite-native/intl';
import {
    type StackNavigationProps,
    type YieldStackParamList,
    YieldStackRoutes,
    useNavigateToInitialScreen,
} from '@suite-native/navigation';

import { YieldCompleteScreenContent } from '../components/YieldCompleteScreenContent';
import { getYieldWithdrawCompleteRows } from '../components/YieldCompleteScreenPresets';
import { useResolvedYieldFlowData } from '../hooks/useResolvedYieldFlowData';
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
    const { account, flowKey, receiptToken, resolutionStatus, token, vault } =
        useResolvedYieldFlowData(route.params);
    const flowType = route.params.withdrawFlowType ?? 'withdraw';
    const session = useSelector((state: StablecoinYieldRootState) =>
        selectStablecoinYieldSessionByFlowKey(state, flowType, flowKey),
    );
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
