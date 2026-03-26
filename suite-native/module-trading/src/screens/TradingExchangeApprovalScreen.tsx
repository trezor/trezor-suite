import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import type { ExchangeTrade } from 'invity-api';

import {
    type TradingRootState,
    selectTradingCoinSymbolByCryptoId,
    selectTradingExchangeActiveQuote,
    tradingExchangeActions,
} from '@suite-common/trading';
import { InlineAlertBox, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import {
    DynamicScreenHeader,
    type RootStackParamList,
    Screen,
    ScreenHeader,
    type StackToStackCompositeScreenProps,
    type TradingStackParamList,
    type TradingStackRoutes,
} from '@suite-native/navigation';

import { ApprovalButton } from '../components/exchange/Approval/ApprovalButton';
import { ExchangeApprovalDetails } from '../components/exchange/Approval/ExchangeApprovalDetails';
import { TradingDeviceConnectionGuard } from '../components/general/TradingDeviceConnectionGuard';
import { useApprovalFlow } from '../hooks/exchange/Approval/useApprovalFlow';
import { useEvmApprovalFees } from '../hooks/exchange/Approval/useEvmApprovalFees';

type TradingExchangeApprovalScreenProps = StackToStackCompositeScreenProps<
    TradingStackParamList,
    TradingStackRoutes.TradingExchangeApproval,
    RootStackParamList
>;

export const TradingExchangeApprovalScreen = ({
    route: { params },
}: TradingExchangeApprovalScreenProps) => {
    const { shouldIncreaseLimit, isRevoked } = params;
    const dispatch = useDispatch();

    const quote = useSelector(selectTradingExchangeActiveQuote);

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

        const quoteWithType = quote.approvalType
            ? quote
            : ({ ...quote, approvalType: 'MINIMAL' } satisfies ExchangeTrade);

        if (!quote.approvalType) {
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

        return () => {
            isActive = false;
        };
    }, [quote, isReady, dispatch, confirmApproval]);

    useEffect(
        () => () => {
            dispatch(tradingExchangeActions.saveSelectedQuote(undefined));
        },
        [dispatch],
    );

    if (!quote) {
        return (
            <Screen header={<ScreenHeader closeActionType="back" />}>
                <InlineAlertBox
                    title={
                        <Translation id="moduleTrading.tradingExchangeApprovalScreen.approveErrorAlert" />
                    }
                    variant="critical"
                />
            </Screen>
        );
    }

    return (
        <TradingDeviceConnectionGuard>
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
                footer={<ApprovalButton isReady={isApprovalReady} isDisabled={!!error} />}
            >
                <VStack spacing="sp12">
                    {!!shouldIncreaseLimit && (
                        <InlineAlertBox
                            variant="info"
                            title={
                                <Translation id="moduleTrading.tradingExchangeApprovalScreen.lowLimitInfoAlert" />
                            }
                        />
                    )}

                    {!!isRevoked && (
                        <InlineAlertBox
                            variant="success"
                            title={
                                <Translation id="moduleTrading.tradingExchangeApprovalScreen.revokeSuccessAlert" />
                            }
                        />
                    )}

                    <ExchangeApprovalDetails
                        exchange={quote.exchange}
                        onApprovalTypeChange={onApprovalTypeChange}
                    />
                </VStack>
            </Screen>
        </TradingDeviceConnectionGuard>
    );
};
