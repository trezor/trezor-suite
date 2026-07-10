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
import { useAlert } from '@suite-native/alerts';
import { Text } from '@suite-native/atoms';
import { Translation, useTranslate } from '@suite-native/intl';
import {
    type StackNavigationProps,
    type YieldStackParamList,
    YieldStackRoutes,
    useNavigateToInitialScreen,
    useOverrideBackNavigation,
} from '@suite-native/navigation';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { ApyValue } from '../components/ApyValue';
import { StablecoinYieldApyBreakdown } from '../components/StablecoinYieldApyBreakdown';
import { YieldCompleteScreenContent } from '../components/YieldCompleteScreenContent';
import { getYieldDepositCompleteRows } from '../components/YieldCompleteScreenPresets';
import { useResolvedYieldFlowData } from '../hooks/useResolvedYieldFlowData';

const abbrStyle = prepareNativeStyle(() => ({
    borderStyle: 'dotted',
    borderBottomWidth: 1,
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
    const { showAlert } = useAlert();
    const { translate } = useTranslate();
    const dispatch = useDispatch();
    const navigateToInitialScreen = useNavigateToInitialScreen();
    const { CryptoAmountFormatter } = useFormatters();
    const { vault, account, apy, flowData, flowKey, resolutionStatus, tokenSymbol } =
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

    const onApyPress = useCallback(() => {
        if (!account || !vault) {
            return;
        }

        showAlert({
            title: vault.outputToken?.name ?? '',
            description: translate(
                'moduleAccounts.accountDetail.stablecoinYield.apyBreakdown.apyLabel',
                { apy },
            ),
            appendix: (
                <StablecoinYieldApyBreakdown
                    networkSymbol={account.symbol}
                    rewards={vault.rewardRate.components}
                    underlyingToken={vault.token}
                    tokenSymbol={vault.token.symbol}
                />
            ),
            textAlign: 'center',
            titleSpacing: 'sp4',
            primaryButtonTitle: translate('generic.buttons.close'),
        });
    }, [account, vault, showAlert, translate, apy]);

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

        return getYieldDepositCompleteRows({
            accountSymbol: account.symbol,
            apyValue: (
                <Text variant="body-md" color="contentPrimary" style={applyStyle(abbrStyle)}>
                    <ApyValue apy={apy} />
                </Text>
            ),
            onApyPress,
            receivedAmount,
            receivedTokenContract: flowData.receiptToken.contractAddress ?? undefined,
            sentAmount,
            sentTokenContract: flowData.token.contractAddress ?? undefined,
        });
    }, [
        CryptoAmountFormatter,
        applyStyle,
        onApyPress,
        account,
        apy,
        flowData,
        resolutionStatus,
        session,
        tokenSymbol,
    ]);

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
