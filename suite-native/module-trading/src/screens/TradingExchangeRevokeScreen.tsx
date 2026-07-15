import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import type { ExchangeTrade } from 'invity-api';

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
import { ExchangeRevokeDetails } from '../components/exchange/Approval/ExchangeRevokeDetails';
import { TradingDeviceConnectionGuard } from '../components/general/TradingDeviceConnectionGuard';
import { useApprovalFlow } from '../hooks/exchange/Approval/useApprovalFlow';
import { useEvmApprovalFees } from '../hooks/exchange/Approval/useEvmApprovalFees';

type TradingExchangeRevokeScreenProps = StackProps<
    RootStackParamList,
    RootStackRoutes.TradingExchangeRevoke
>;

const TradingExchangeRevokeScreenContent = ({
    route: { params },
    navigation,
}: TradingExchangeRevokeScreenProps) => {
    const { shouldIncreaseLimit } = params;
    const dispatch = useDispatch();
    const reportToAnalytics = useExchangeAnalyticsStepReport('revoke-preview');

    const quote = useSelector(selectTradingExchangeSelectedQuote);

    const { isReady, isConfirming, error: confirmError, confirmApproval } = useApprovalFlow();

    const coinSymbol = useSelector((state: TradingRootState) =>
        selectTradingCoinSymbolByCryptoId(state, quote?.send),
    );

    const {
        fee,
        isLoading: isComposingFees,
        error: feeError,
    } = useEvmApprovalFees({
        approvalTypeOverride: 'ZERO',
    });

    const isLoading = isConfirming || isComposingFees;
    const error = confirmError || feeError;
    const isRevokeReady = !isLoading && !error && fee !== undefined;

    const hasConfirmedRef = useRef(false);

    useEffect(() => {
        if (hasConfirmedRef.current) {
            return;
        }

        if (!quote) {
            console.error('No quote to revoke approval');

            return;
        }

        if (!isReady) {
            return;
        }

        hasConfirmedRef.current = true;

        const quoteWithType =
            quote.approvalType === 'ZERO'
                ? quote
                : ({ ...quote, approvalType: 'ZERO' } satisfies ExchangeTrade);

        if (quote.approvalType !== 'ZERO') {
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
    }, [quote, isReady, dispatch, confirmApproval, reportToAnalytics]);

    useNavigationRemoveActionInterceptor({
        onInterceptedAction: action => {
            dispatch(tradingExchangeActions.saveSelectedQuote(undefined));
            reportToAnalytics('cancel');
            navigation.dispatch(action);
        },
    });

    if (!quote) {
        return (
            <Screen header={<ScreenHeader closeActionType="back" />}>
                <InlineAlertBox
                    title={
                        <Translation id="moduleTrading.tradingExchangeRevokeScreen.revokeErrorAlert" />
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
                            id="moduleTrading.tradingExchangeRevokeScreen.revokeTitle"
                            values={{ symbol: coinSymbol }}
                        />
                    }
                    subtitle={
                        shouldIncreaseLimit ? undefined : (
                            <Translation
                                id="moduleTrading.tradingExchangeRevokeScreen.revokeSubtitle"
                                values={{ symbol: coinSymbol }}
                            />
                        )
                    }
                    closeActionType="back"
                />
            }
            footer={
                <ApprovalButton
                    isReady={isRevokeReady}
                    isDisabled={!!error}
                    flowType={shouldIncreaseLimit ? 'revoke-and-approve' : 'revoke'}
                />
            }
        >
            <VStack spacing="sp12">
                {!!shouldIncreaseLimit && (
                    <InlineAlertBox
                        intent="info"
                        title={
                            <Translation id="moduleTrading.tradingExchangeRevokeScreen.lowLimitInfoAlert" />
                        }
                    />
                )}

                <ExchangeRevokeDetails exchange={quote.exchange} />
            </VStack>
        </Screen>
    );
};

export const TradingExchangeRevokeScreen = (props: TradingExchangeRevokeScreenProps) => (
    <TradingDeviceConnectionGuard>
        <TradingExchangeRevokeScreenContent {...props} />
    </TradingDeviceConnectionGuard>
);
