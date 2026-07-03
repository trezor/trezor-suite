import { useEffect } from 'react';

import type { BankAccount } from 'invity-api';

import { events, selectDesktopAnalyticsDep } from '@suite/analytics';
import { useDevice } from '@suite/device';
import { type TranslationKey, useTranslation } from '@suite/intl';
import { goto } from '@suite/router';
import { selectHasExperimentalFeature } from '@suite/settings';
import { useServices } from '@suite-common/dependency-injection';
import { Feature, selectIsFeatureEnabled } from '@suite-common/message-system';
import { notificationsActions } from '@suite-common/toast-notifications';
import {
    type TradingSignAndPushSendFormTransactionProps,
    isSendRejectedError,
    selectTradingIsSlip24Allowed,
    selectTradingSellActiveTrade,
    selectTradingSellInfo,
    selectTradingSellIsFromRedirect,
    selectTradingSellIsLoading,
    selectTradingSellQuotesRequest,
    selectTradingSellSelectedQuote,
    selectTradingSellTransactionId,
    sellThunks,
    tradingSellActions,
    tradingThunks,
} from '@suite-common/trading';
import { selectAccountByKey } from '@suite-common/wallet-core';

import { signAndPushSendFormTransactionThunk } from 'src/actions/wallet/send/sendFormThunks';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { useTradingAssetDecimals } from 'src/hooks/wallet/trading/form/common/useTradingAssetDecimals';
import { useTradingSellTradeRequest } from 'src/hooks/wallet/trading/form/common/useTradingSellTradeRequest';
import { useTradingFormAccount } from 'src/hooks/wallet/trading/form/useTradingFormAccount';
import { useServerEnvironment } from 'src/hooks/wallet/trading/useServerEnviroment';
import { useBitcoinAmountUnit } from 'src/hooks/wallet/useBitcoinAmountUnit';

export const useTradingSellConfirm = () => {
    const { analytics } = useServices(selectDesktopAnalyticsDep);
    const dispatch = useDispatch();
    const { translationString } = useTranslation();
    const { device } = useDevice();

    useServerEnvironment();

    const selectedQuote = useSelector(selectTradingSellSelectedQuote);
    const sellInfo = useSelector(selectTradingSellInfo);
    const isLoading = useSelector(selectTradingSellIsLoading);
    const quotesRequest = useSelector(selectTradingSellQuotesRequest);
    const isFromRedirect = useSelector(selectTradingSellIsFromRedirect);
    const transactionId = useSelector(selectTradingSellTransactionId);

    const trade = useSelector(selectTradingSellActiveTrade);

    const { account: formAccount } = useTradingFormAccount('sell');
    const tradeSendAccount = useSelector(
        state => selectAccountByKey(state, trade?.sendAccountKey) ?? undefined,
    );
    const account = tradeSendAccount ?? formAccount;

    const { isBtcSatsAmountUnit: shouldSendInSats } = useBitcoinAmountUnit(account?.symbol);

    const { getAssetDecimals } = useTradingAssetDecimals();
    const sellCryptoId = (trade?.data ?? selectedQuote)?.cryptoCurrency;
    const decimals = getAssetDecimals({ accountKey: account?.key, cryptoId: sellCryptoId });

    const isSlip24FeatureEnabled = useSelector(state =>
        selectIsFeatureEnabled(state, Feature.trading.slip24, true),
    );
    const isSlip24ExperimentalFeatureEnabled = useSelector(selectHasExperimentalFeature('slip24'));
    const isSlip24Active = useSelector(state =>
        account
            ? selectTradingIsSlip24Allowed(
                  state,
                  account,
                  isSlip24FeatureEnabled && isSlip24ExperimentalFeatureEnabled,
              )
            : false,
    );

    const { getTradeRequestParams, handleSellTrade } = useTradingSellTradeRequest(account);

    useEffect(() => {
        dispatch(tradingThunks.loadInitialDataThunk({ activeSection: 'sell' }));
    }, [dispatch]);

    useEffect(() => {
        if (!quotesRequest) {
            dispatch(goto({ routeName: 'wallet-trading-sell' }));
        }
    }, [quotesRequest, dispatch]);

    useEffect(() => {
        if (isFromRedirect) {
            if (transactionId && trade) {
                dispatch(tradingSellActions.saveSelectedQuote(trade.data));
                dispatch(tradingSellActions.setFormStep('SEND_TRANSACTION'));
                if (trade.sendAccountKey) {
                    dispatch(tradingSellActions.setTradingAccountKey(trade.sendAccountKey));
                }
            }

            dispatch(tradingSellActions.setIsFromRedirect(false));
        }
    }, [isFromRedirect, trade, transactionId, dispatch]);

    const confirmTrade = async (bankAccount: BankAccount) => {
        if (!selectedQuote || !account) return;

        const quote = { ...selectedQuote, bankAccount };
        const commonFunctions = await getTradeRequestParams(quote);

        if (!commonFunctions) return;

        const { returnUrl, processResponseData } = commonFunctions;

        const triggerAnalyticsTradeConfirmation = () => {
            analytics.report({
                type: events.tradeConfirmTradeEvent.name,
                payload: { action: 'sell' },
            });
        };

        await dispatch(
            sellThunks.confirmTradeThunk({
                account,
                bankAccount,
                returnUrl,
                triggerAnalyticsTradeConfirmation,
                processResponseData,
            }),
        );
    };

    const addBankAccount = async () => {
        if (!selectedQuote) return;

        await handleSellTrade(selectedQuote);
    };

    const sendTransaction = async () => {
        if (!account) return false;

        const nextStep = () => {
            dispatch(goto({ routeName: 'wallet-trading-sell-detail' }));
        };

        const signAndPushSendFormTransaction = async ({
            formState,
            precomposedTransaction,
            selectedAccount,
            paymentRequests,
        }: TradingSignAndPushSendFormTransactionProps) =>
            await dispatch(
                signAndPushSendFormTransactionThunk({
                    formState,
                    precomposedTransaction,
                    selectedAccount,
                    paymentRequests,
                }),
            ).unwrap();

        try {
            await dispatch(
                sellThunks.sendTransactionThunk({
                    account,
                    trade: trade?.data,
                    shouldSendInSats,
                    decimals,
                    // TODO: slip24 - exclude from debug mode
                    isSlip24Active,
                    nextStep,
                    signAndPushSendFormTransaction,
                }),
            ).unwrap();

            return true;
        } catch (e) {
            if (!isSendRejectedError<TranslationKey>(e)) {
                return false;
            }

            if (e.type !== 'sign-transaction-timeout') {
                dispatch(
                    notificationsActions.addToast({
                        type: e.type,
                        error: translationString(e.error.id, e.error.values),
                    }),
                );
            }

            return false;
        }
    };

    const isConfirmDisabled = isLoading || !selectedQuote || !account;

    return {
        selectedQuote,
        sellInfo,
        account,
        device,
        trade,
        isLoading,
        isConfirmDisabled,
        confirmTrade,
        addBankAccount,
        sendTransaction,
    };
};

export type TradingSellConfirmValues = ReturnType<typeof useTradingSellConfirm>;
