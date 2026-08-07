import { useCallback, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { type RouteProp, useNavigation, useRoute } from '@react-navigation/native';

import { events } from '@suite-common/analytics';
import { useServices } from '@suite-common/dependency-injection';
import { buildUserFeedbackData, sendFeedbackAction } from '@suite-common/feedback';
import { getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import {
    type StablecoinYieldRootState,
    selectStablecoinYieldSessionByFlowKey,
    stablecoinYieldActions,
} from '@suite-common/wallet-core';
import { selectNativeAnalyticsDep } from '@suite-native/analytics';
import { Text } from '@suite-native/atoms';
import { useFeedbackForm } from '@suite-native/feature-feedback';
import { Translation, selectSupportedLanguageLocale } from '@suite-native/intl';
import {
    type StackNavigationProps,
    type YieldStackParamList,
    YieldStackRoutes,
    useNavigateToInitialScreen,
    useOverrideBackNavigation,
} from '@suite-native/navigation';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { ApyValue } from '../components/ApyValue';
import { YieldCompleteScreenContent } from '../components/YieldCompleteScreenContent';
import { getYieldDepositCompleteRows } from '../components/YieldCompleteScreenPresets';
import { useApyBreakdownAlert } from '../hooks/useApyBreakdownAlert';
import { useResolvedYieldFlowData } from '../hooks/useResolvedYieldFlowData';
import { formatEarnTokenAmount } from '../utils/earnAmountUtils';

const abbrStyle = prepareNativeStyle(({ colors }) => ({
    borderStyle: 'dotted',
    borderBottomWidth: 1,
    borderColor: colors.contentSecondary,
}));

type RouteProps = RouteProp<YieldStackParamList, YieldStackRoutes.YieldDepositComplete>;
type NavigationProps = StackNavigationProps<
    YieldStackParamList,
    YieldStackRoutes.YieldDepositComplete
>;

export const YieldDepositCompleteScreen = () => {
    const route = useRoute<RouteProps>();
    const navigation = useNavigation<NavigationProps>();
    const { applyStyle } = useNativeStyles();
    const dispatch = useDispatch();
    const navigateToInitialScreen = useNavigateToInitialScreen();
    const locale = useSelector(selectSupportedLanguageLocale);
    const { vault, account, apy, flowData, flowKey, resolutionStatus, tokenSymbol } =
        useResolvedYieldFlowData(route.params);
    const session = useSelector((state: StablecoinYieldRootState) =>
        selectStablecoinYieldSessionByFlowKey(state, 'deposit', flowKey),
    );

    const apyBreakdownAlert = useApyBreakdownAlert({ account, vault });
    const { analytics } = useServices(selectNativeAnalyticsDep);

    const feedbackForm = useFeedbackForm();

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
            dispatch(stablecoinYieldActions.disposeSession({ flowType: 'deposit', flowKey }));
        }

        if (feedbackForm.isValid) {
            const userData = buildUserFeedbackData();

            const { rating, description } = feedbackForm;

            dispatch(
                sendFeedbackAction({
                    type: 'SUGGESTION',
                    payload: {
                        category: 'yield',
                        feature: 'deposit',
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
        navigateToInitialScreen,
        vault?.id,
    ]);

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
                <Text variant="body-md" color="contentPrimary" style={applyStyle(abbrStyle)}>
                    <ApyValue apy={apy} />
                </Text>
            ),
            onApyPress: apyBreakdownAlert.onPress,
            receivedAmount,
            receivedTokenContract: flowData.receiptToken.contractAddress ?? undefined,
            sentAmount,
            sentTokenContract: hasWrappedInput
                ? undefined
                : (flowData.token.contractAddress ?? undefined),
        });
    }, [
        applyStyle,
        apyBreakdownAlert.onPress,
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
        <YieldCompleteScreenContent
            buttonTranslationId={
                feedbackForm.isValid
                    ? 'earn.yieldCompleteScreen.sendAndBackToOverview'
                    : 'earn.yieldCompleteScreen.backToOverview'
            }
            onButtonPress={handleExit}
            rows={rows}
            title={<Translation id="earn.yieldDepositCompleteScreen.title" />}
            subtitle={<Translation id="earn.yieldDepositCompleteScreen.subtitle" />}
            feedbackForm={feedbackForm}
        />
    );
};
