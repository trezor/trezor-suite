import { useCallback, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { type RouteProp, useNavigation, useRoute } from '@react-navigation/native';

import { useFormatters } from '@suite-common/formatters';
import {
    type StablecoinYieldRootState,
    selectStablecoinYieldSessionByFlowKey,
    stablecoinYieldActions,
} from '@suite-common/wallet-core';
import { toTokenSymbol } from '@suite-common/wallet-types';
import { Translation } from '@suite-native/intl';
import {
    type StackNavigationProps,
    type YieldStackParamList,
    YieldStackRoutes,
    useNavigateToInitialScreen,
    useOverrideBackNavigation,
} from '@suite-native/navigation';

import { YieldCompleteScreenContent } from '../components/YieldCompleteScreenContent';
import { getYieldDepositCompleteRows } from '../components/YieldCompleteScreenPresets';
import { useResolvedYieldFlowData } from '../hooks/useResolvedYieldFlowData';

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
    const { CryptoAmountFormatter } = useFormatters();
    const { account, apy, flowData, flowKey, resolutionStatus, tokenSymbol } =
        useResolvedYieldFlowData(route.params);
    const session = useSelector((state: StablecoinYieldRootState) =>
        selectStablecoinYieldSessionByFlowKey(state, 'deposit', flowKey),
    );

    const handleExit = useCallback(() => {
        if (flowKey) {
            dispatch(stablecoinYieldActions.disposeSession({ flowType: 'deposit', flowKey }));
        }

        navigateToInitialScreen();
    }, [dispatch, flowKey, navigateToInitialScreen]);

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

        const receivedAmount = CryptoAmountFormatter.format(session.result.completedReceiptAmount, {
            symbol: toTokenSymbol(flowData.receiptToken.symbol),
            isBalance: true,
            withSymbol: true,
            isEllipsisAppended: false,
            maxDisplayedDecimals: 8,
        });
        const sentAmount = CryptoAmountFormatter.format(session.result.completedAmount, {
            symbol: tokenSymbol,
            isBalance: true,
            withSymbol: true,
            isEllipsisAppended: false,
            maxDisplayedDecimals: 8,
        });
        const apyValue =
            apy === null ? <Translation id="earn.notAvailableShort" /> : `${apy.toFixed(2)}%`;

        return getYieldDepositCompleteRows({
            accountSymbol: account.symbol,
            apyValue,
            receivedAmount,
            receivedTokenContract: flowData.receiptToken.contractAddress ?? undefined,
            sentAmount,
            sentTokenContract: flowData.token.contractAddress ?? undefined,
        });
    }, [CryptoAmountFormatter, account, apy, flowData, resolutionStatus, session, tokenSymbol]);

    if (resolutionStatus !== 'resolved' || session?.step !== 'complete') {
        return null;
    }

    return (
        <YieldCompleteScreenContent
            buttonTranslationId="earn.yieldCompleteScreen.backToOverview"
            onButtonPress={handleExit}
            rows={rows}
            title={<Translation id="earn.yieldDepositCompleteScreen.title" />}
            subtitle={<Translation id="earn.yieldDepositCompleteScreen.subtitle" />}
        />
    );
};
