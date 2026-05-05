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
    navigation,
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

        return () => {
            isActive = false;
        };
    }, [quote, isReady, isRevoked, dispatch, confirmApproval]);

    useEffect(() => {
        // Clear the selected quote only when the user navigates backward (back button / swipe back).
        // popToTop() translates to POP with count > 1 — those removals are programmatic forward
        // navigation so the quote must remain in Redux for the next screen to read it.
        const unsubscribe = navigation.addListener('beforeRemove', e => {
            const { type, payload } = e.data.action as {
                type: string;
                payload?: { count?: number };
            };
            const isSingleBackPress =
                type === 'GO_BACK' || (type === 'POP' && (payload?.count ?? 1) <= 1);

            if (isSingleBackPress) {
                dispatch(tradingExchangeActions.saveSelectedQuote(undefined));
            }
        });

        return unsubscribe;
    }, [dispatch, navigation]);

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
                footer={
                    <ApprovalButton
                        isReady={isApprovalReady}
                        isDisabled={!!error}
                        flowType="approve"
                    />
                }
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
