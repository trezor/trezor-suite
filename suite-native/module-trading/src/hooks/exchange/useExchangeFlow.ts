import { useCallback, useMemo, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { ExchangeTrade } from 'invity-api';

import { useServices } from '@suite-common/dependency-injection';
import { selectSelectedDevice } from '@suite-common/device';
import {
    type TradingSendRejectedProps,
    exchangeThunks,
    selectTradingExchangeSelectedQuote,
} from '@suite-common/trading';
import { events, selectNativeAnalyticsDep } from '@suite-native/analytics';
import { type TxKeyPath } from '@suite-native/intl';
import {
    type ExchangeFlowType,
    type RootStackParamList,
    RootStackRoutes,
    type StackNavigationProps,
} from '@suite-native/navigation';
import { buildTradingUrl, useBrowserAuth } from '@suite-native/trading-browser-auth';
import { selectExchangeSelectedSendAccount } from '@suite-native/trading-state';

import {
    type TradingTransactionSignAndSendProps,
    useTradingTransaction,
} from '../general/useTradingTransaction';

export type TradingExchangeConfirmTradeProps = {
    receiveAddress: string;
    extraField?: string;
    trade?: ExchangeTrade;
    approvalFlow?: boolean;
    nextStep: () => void;
};

export type TradingExchangeSignAndSendTransactionProps = {
    nextStep: () => void;
    onError: (error: TradingSendRejectedProps) => void;
};

export type UseExchangeFlowProps = {
    flowType?: ExchangeFlowType;
};

export const useExchangeFlow = ({ flowType }: UseExchangeFlowProps = {}) => {
    const navigation =
        useNavigation<
            StackNavigationProps<
                RootStackParamList,
                | RootStackRoutes.TradingExchangePreview
                | RootStackRoutes.TradingExchangeOutputsReview
            >
        >();
    const dispatch = useDispatch();
    const { analytics } = useServices(selectNativeAnalyticsDep);
    const quote = useSelector(selectTradingExchangeSelectedQuote);
    const device = useSelector(selectSelectedDevice);
    const sendAccount = useSelector(selectExchangeSelectedSendAccount);

    const { openBrowserForFormData } = useBrowserAuth('exchange');
    const quoteStatus = quote?.status;

    useFocusEffect(
        useCallback(() => {
            if (quoteStatus === 'APPROVAL_PENDING') {
                // 'swap' and undefined both map to 'approve': the approval tx
                // is always the first step before a swap, so confirming it means approving.
                const confirmingFlowType =
                    flowType === 'revoke' || flowType === 'revoke-and-approve'
                        ? flowType
                        : 'approve';
                navigation.navigate(RootStackRoutes.TradingConfirming, {
                    flowType: confirmingFlowType,
                });
            }
        }, [quoteStatus, navigation, flowType]),
    );

    const getCommonFunctions = useCallback(
        (trade?: ExchangeTrade) => {
            const tradeToUse = trade ?? quote;

            if (!tradeToUse) {
                console.error('Trade or selectedQuote is required to getCommonFunctions');

                return null;
            }

            const returnUrl = buildTradingUrl({
                actionType: 'trade',
                tradeType: 'exchange',
                orderId: tradeToUse.orderId,
            });

            const triggerAnalyticsTradeConfirmation = () => {
                analytics.report({
                    type: events.tradingConfirmTradeEvent.name,
                    payload: {
                        type: 'exchange',
                    },
                });
            };

            const processResponseData = (response: ExchangeTrade) =>
                openBrowserForFormData(response.tradeForm?.form, returnUrl);

            return {
                returnUrl,
                triggerAnalyticsTradeConfirmation,
                processResponseData,
            };
        },
        [openBrowserForFormData, analytics, quote],
    );

    const baseCommonFunctions = useMemo(() => getCommonFunctions(), [getCommonFunctions]);

    const {
        txnErrorString,
        composeRequest,
        fetchFeesAndCompose,
        signAndSendTransaction,
        serializedTx,
        resolveTransactionSendConsent,
        isTransactionSendConsentRequested,
    } = useTradingTransaction({
        tradeType: 'exchange',
        returnUrl: baseCommonFunctions?.returnUrl,
        processResponseData: baseCommonFunctions?.processResponseData,
        triggerAnalyticsTradeConfirmation: baseCommonFunctions?.triggerAnalyticsTradeConfirmation,
    });

    const inFlightConfirmTradePromiseRef = useRef<{ abort: (reason?: string) => void } | null>(
        null,
    );

    // changing trade state and initial confirmation
    const confirmTrade = useCallback(
        async ({
            receiveAddress,
            extraField,
            trade,
            approvalFlow,
            nextStep,
        }: TradingExchangeConfirmTradeProps): Promise<boolean> => {
            const commonFunctions = getCommonFunctions(trade);

            if (!trade || !sendAccount || !commonFunctions) {
                console.error(
                    'Trade, send account and common functions are required to confirm trade',
                );

                return false;
            }

            const { returnUrl, triggerAnalyticsTradeConfirmation, processResponseData } =
                commonFunctions;

            const promiseAction = dispatch(
                exchangeThunks.confirmTradeThunk({
                    returnUrl,
                    receiveAddress,
                    account: sendAccount,
                    extraField,
                    trade,
                    approvalFlow,
                    triggerAnalyticsTradeConfirmation,
                    processResponseData,
                    nextStep,
                }),
            );
            inFlightConfirmTradePromiseRef.current = promiseAction;

            return !!(await promiseAction.unwrap());
        },
        [getCommonFunctions, sendAccount, dispatch],
    );

    const abortConfirmTrade = useCallback(() => {
        inFlightConfirmTradePromiseRef.current?.abort();
        inFlightConfirmTradePromiseRef.current = null;
    }, []);

    // Signs EIP-712 typed data on the Trezor device (used by 1inch Fusion+ orders)
    // and submits the signature to the exchange API via confirmExchangeTradeThunk.
    // No on-chain transaction is composed or sent.
    const signDataAndConfirm = useCallback(
        async ({ nextStep, onError }: TradingTransactionSignAndSendProps) => {
            const commonFunctions = getCommonFunctions();

            if (!sendAccount || !device || !commonFunctions) {
                console.warn('signDataAndConfirm: missing account, device, or common functions');

                return false;
            }

            const { returnUrl, triggerAnalyticsTradeConfirmation, processResponseData } =
                commonFunctions;

            try {
                await dispatch(
                    exchangeThunks.signDataAndConfirmThunk({
                        account: sendAccount,
                        device,
                        returnUrl,
                        triggerAnalyticsTradeConfirmation,
                        processResponseData,
                        nextStep,
                    }),
                ).unwrap();

                return true;
            } catch (e) {
                onError(e as TradingSendRejectedProps<TxKeyPath>);

                return false;
            }
        },
        [getCommonFunctions, sendAccount, device, dispatch],
    );

    return {
        txnErrorString,
        confirmTrade,
        abortConfirmTrade,
        signDataAndConfirm,
        composeRequest,
        fetchFeesAndCompose,
        signAndSendTransaction,
        serializedTx,
        resolveTransactionSendConsent,
        isTransactionSendConsentRequested,
    };
};
