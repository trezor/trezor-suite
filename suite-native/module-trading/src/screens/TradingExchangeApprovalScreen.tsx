import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import type { DexApprovalType, ExchangeTrade } from 'invity-api';

import {
    type TradingRootState,
    selectTradingCoinSymbolByCryptoId,
    selectTradingExchangeSelectedQuote,
    tradingExchangeActions,
} from '@suite-common/trading';
import { InlineAlertBox, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import {
    DynamicScreenHeader,
    type RootStackParamList,
    type RootStackRoutes,
    Screen,
    ScreenHeader,
    type StackProps,
    useNavigationRemoveActionInterceptor,
} from '@suite-native/navigation';
import { useExchangeAnalyticsStepReport } from '@suite-native/trading-analytics';

import { ApprovalButton } from '../components/exchange/Approval/ApprovalButton';
import { ExchangeApprovalDetails } from '../components/exchange/Approval/ExchangeApprovalDetails';
import { TradingDeviceConnectionGuard } from '../components/general/TradingDeviceConnectionGuard';
import { useApprovalFlow } from '../hooks/exchange/Approval/useApprovalFlow';
import { useEvmApprovalFees } from '../hooks/exchange/Approval/useEvmApprovalFees';

type TradingExchangeApprovalScreenProps = StackProps<
    RootStackParamList,
    RootStackRoutes.TradingExchangeApproval
>;

const TradingExchangeApprovalScreenContent = ({
    route: { params },
    navigation,
}: TradingExchangeApprovalScreenProps) => {
    const { shouldIncreaseLimit, isRevoked } = params;
    const dispatch = useDispatch();
    const reportToAnalytics = useExchangeAnalyticsStepReport('approval-preview');

    const quote = useSelector(selectTradingExchangeSelectedQuote);

    const {
        isReady,
        isConfirming,
        error: confirmError,
        confirmApproval,
        onApprovalTypeChange,
    } = useApprovalFlow();

    const coinSymbol = useSelector((state: TradingRootState) =>
        selectTradingCoinSymbolByCryptoId(state, quote?.send),
    );

    const { fee, isLoading: isComposingFees, error: feeError } = useEvmApprovalFees();

    const isLoading = isConfirming || isComposingFees;
    const error = confirmError || feeError;
    const isApprovalReady = !isLoading && !error && fee !== undefined;

    const hasConfirmedRef = useRef(false);

    useEffect(() => {
        if (hasConfirmedRef.current) {
            return;
        }

        if (!quote) {
            console.error('No quote to confirm approval');

            return;
        }

        if (!isReady) {
            return;
        }

        hasConfirmedRef.current = true;

        // When arriving from a revoke-and-approve flow the quote still carries approvalType: 'ZERO'
        // from the revoke step. Reset it to 'MINIMAL' so we sign an approval, not another revoke.
        const needsTypeReset = !quote.approvalType || isRevoked;
        const quoteWithType = needsTypeReset
            ? ({ ...quote, approvalType: 'MINIMAL' } satisfies ExchangeTrade)
            : quote;

        if (needsTypeReset) {
            dispatch(tradingExchangeActions.saveSelectedQuote(quoteWithType));
        }

        let isActive = true;

        confirmApproval(quoteWithType).then(response => {
            if (!isActive) {
                return;
            }

            if (response === undefined) {
                hasConfirmedRef.current = false;
            }
        });

        reportToAnalytics('visit');

        return () => {
            isActive = false;
        };
    }, [quote, isReady, isRevoked, dispatch, confirmApproval, reportToAnalytics]);

    useNavigationRemoveActionInterceptor({
        onInterceptedAction: action => {
            dispatch(tradingExchangeActions.saveSelectedQuote(undefined));
            reportToAnalytics('cancel');
            navigation.dispatch(action);
        },
    });

    const onApprovalTypeChangeWithAnalytics = (approvalType: DexApprovalType) => {
        onApprovalTypeChange(approvalType);
        reportToAnalytics(`value_change`);
    };

    if (!quote) {
        return (
            <Screen header={<ScreenHeader closeActionType="back" />}>
                <InlineAlertBox
                    title={
                        <Translation id="moduleTrading.tradingExchangeApprovalScreen.approveErrorAlert" />
                    }
                    intent="critical"
                />
            </Screen>
        );
    }

    return (
        <Screen
            header={
                <DynamicScreenHeader
                    title={
                        <Translation
                            id="moduleTrading.tradingExchangeApprovalScreen.approveTitle"
                            values={{ symbol: coinSymbol }}
                        />
                    }
                    subtitle={
                        <Translation
                            id="moduleTrading.tradingExchangeApprovalScreen.approveSubtitle"
                            values={{ symbol: coinSymbol }}
                        />
                    }
                    closeActionType="back"
                />
            }
            footer={
                <ApprovalButton isReady={isApprovalReady} isDisabled={!!error} flowType="approve" />
            }
        >
            <VStack spacing="sp12">
                {!!shouldIncreaseLimit && (
                    <InlineAlertBox
                        intent="info"
                        title={
                            <Translation id="moduleTrading.tradingExchangeApprovalScreen.lowLimitInfoAlert" />
                        }
                    />
                )}

                {!!isRevoked && (
                    <InlineAlertBox
                        intent="brand"
                        title={
                            <Translation id="moduleTrading.tradingExchangeApprovalScreen.revokeSuccessAlert" />
                        }
                    />
                )}

                <ExchangeApprovalDetails
                    exchange={quote.exchange}
                    onApprovalTypeChange={onApprovalTypeChangeWithAnalytics}
                />
            </VStack>
        </Screen>
    );
};

export const TradingExchangeApprovalScreen = (props: TradingExchangeApprovalScreenProps) => (
    <TradingDeviceConnectionGuard>
        <TradingExchangeApprovalScreenContent {...props} />
    </TradingDeviceConnectionGuard>
);
