import { useCallback, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { type RouteProp, useNavigation, useRoute } from '@react-navigation/native';

import { useFormatters } from '@suite-common/formatters';
import {
    type StablecoinYieldRootState,
    getConvertedOutputTokenBalanceToInputTokenAmount,
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

    const handleExit = useCallback(() => {
        if (flowKey) {
            dispatch(stablecoinYieldActions.disposeSession({ flowType, flowKey }));
        }

        navigateToInitialScreen();
    }, [dispatch, flowKey, flowType, navigateToInitialScreen]);

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

        const { completedAmount } = session.result;
        const underlyingSymbol = toTokenSymbol(vault.token.symbol.toUpperCase());
        const vaultTokenSymbol = toTokenSymbol(vault.outputToken.symbol.toUpperCase());
        const receivedUnderlyingAmount = isSharesInput
            ? getConvertedOutputTokenBalanceToInputTokenAmount({
                  networkSymbol: account.symbol,
                  token: vault.token,
                  outputToken: vault.outputToken,
                  outputTokenBalance: completedAmount,
                  pricePerShareState: vault.state?.pricePerShareState,
              })
            : completedAmount;

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
            receivedTokenContract: vault.token.address ?? undefined,
            withdrawalAmount,
            withdrawalTokenContract: vault.outputToken.address ?? undefined,
        });
    }, [CryptoAmountFormatter, account, isSharesInput, resolutionStatus, session, vault]);

    if (resolutionStatus !== 'resolved' || session?.step !== 'complete') {
        return null;
    }

    return (
        <YieldCompleteScreenContent
            buttonTranslationId="earn.yieldCompleteScreen.backToOverview"
            onButtonPress={handleExit}
            rows={rows}
            title={<Translation id="earn.yieldWithdrawCompleteScreen.title" />}
            subtitle={<Translation id="earn.yieldWithdrawCompleteScreen.subtitle" />}
        />
    );
};
