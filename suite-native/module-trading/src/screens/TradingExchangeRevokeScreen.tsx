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
import { ExchangeRevokeDetails } from '../components/exchange/Approval/ExchangeRevokeDetails';
import { TradingDeviceConnectionGuard } from '../components/general/TradingDeviceConnectionGuard';
import { useApprovalFlow } from '../hooks/exchange/Approval/useApprovalFlow';
import { useEvmApprovalFees } from '../hooks/exchange/Approval/useEvmApprovalFees';

type TradingExchangeRevokeScreenProps = StackToStackCompositeScreenProps<
    TradingStackParamList,
    TradingStackRoutes.TradingExchangeRevoke,
    RootStackParamList
>;

export const TradingExchangeRevokeScreen = ({
    route: { params },
    navigation,
}: TradingExchangeRevokeScreenProps) => {
    const { shouldIncreaseLimit } = params;
    const dispatch = useDispatch();

    const quote = useSelector(selectTradingExchangeActiveQuote);

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

        return () => {
            isActive = false;
        };
    }, [quote, isReady, dispatch, confirmApproval]);

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
                        <Translation id="moduleTrading.tradingExchangeRevokeScreen.revokeErrorAlert" />
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
                            variant="info"
                            title={
                                <Translation id="moduleTrading.tradingExchangeRevokeScreen.lowLimitInfoAlert" />
                            }
                        />
                    )}

                    <ExchangeRevokeDetails exchange={quote.exchange} />
                </VStack>
            </Screen>
        </TradingDeviceConnectionGuard>
    );
};
