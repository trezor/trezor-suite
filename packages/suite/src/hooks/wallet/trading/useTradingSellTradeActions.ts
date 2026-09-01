import type { BankAccount } from 'invity-api';

import { events, selectDesktopAnalyticsDep } from '@suite/analytics';
import { type TranslationKey, useTranslation } from '@suite/intl';
import { goto } from '@suite/router';
import { selectHasExperimentalFeature } from '@suite/settings';
import { useServices } from '@suite-common/dependency-injection';
import { Feature, selectIsFeatureEnabled } from '@suite-common/message-system';
import { useDispatch } from '@suite-common/redux-utils';
import { notificationsActions } from '@suite-common/toast-notifications';
import {
    type TradingSignAndPushSendFormTransactionProps,
    isSendRejectedError,
    isSilentSendRejection,
    selectTradingComposedTransactionInfo,
    selectTradingIsSlip24Allowed,
    selectTradingSellActiveTrade,
    selectTradingSellInfo,
    selectTradingSellQuotesRequest,
    selectTradingSellSelectedQuote,
    sellThunks,
} from '@suite-common/trading';
import { selectAccountByKey } from '@suite-common/wallet-core';

import { signAndPushSendFormTransactionThunk } from 'src/actions/wallet/send/sendFormThunks';
import { requestSellTradeThunk } from 'src/actions/wallet/trading/sell/requestSellTradeThunk';
import { submitRequestForm } from 'src/actions/wallet/trading/tradingCommonActions';
import { useSelector } from 'src/hooks/suite';
import { useTradingAssetDecimals } from 'src/hooks/wallet/trading/form/common/useTradingAssetDecimals';
import { useTradingFormAccount } from 'src/hooks/wallet/trading/form/useTradingFormAccount';
import { useBitcoinAmountUnit } from 'src/hooks/wallet/useBitcoinAmountUnit';
import { buildSellReturnUrl } from 'src/utils/wallet/trading/buildSellReturnUrl';

export const useTradingSellTradeActions = () => {
    const { analytics } = useServices(selectDesktopAnalyticsDep);
    const dispatch = useDispatch();
    const { translationString } = useTranslation();

    const selectedQuote = useSelector(selectTradingSellSelectedQuote);
    const trade = useSelector(selectTradingSellActiveTrade);
    const sellInfo = useSelector(selectTradingSellInfo);
    const quotesRequest = useSelector(selectTradingSellQuotesRequest);
    const composedInfo = useSelector(selectTradingComposedTransactionInfo);

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

    const confirmTrade = async (bankAccount: BankAccount) => {
        if (!selectedQuote || !account) return;

        const quote = { ...selectedQuote, bankAccount };
        const returnUrl = await buildSellReturnUrl({
            quote,
            account,
            sellInfo,
            quotesRequest,
            composedInfo,
        });

        if (!returnUrl) return;

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
                processResponseData: response => {
                    dispatch(submitRequestForm(response.tradeForm?.form));
                },
            }),
        );
    };

    const addBankAccount = async () => {
        if (!selectedQuote) return;

        await dispatch(requestSellTradeThunk({ quote: selectedQuote })).unwrap();
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

            if (!isSilentSendRejection(e.type)) {
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

    return {
        account,
        confirmTrade,
        addBankAccount,
        sendTransaction,
    };
};

export type TradingSellTradeActionsValues = ReturnType<typeof useTradingSellTradeActions>;
