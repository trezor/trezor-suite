import type { BankAccount } from 'invity-api';

import { events, selectDesktopAnalyticsDep } from '@suite/analytics';
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
    selectTradingSellSelectedQuote,
    sellThunks,
} from '@suite-common/trading';
import { selectAccountByKey } from '@suite-common/wallet-core';

import { signAndPushSendFormTransactionThunk } from 'src/actions/wallet/send/sendFormThunks';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { useTradingAssetDecimals } from 'src/hooks/wallet/trading/form/common/useTradingAssetDecimals';
import { useTradingSellTradeRequest } from 'src/hooks/wallet/trading/form/common/useTradingSellTradeRequest';
import { useTradingFormAccount } from 'src/hooks/wallet/trading/form/useTradingFormAccount';
import { useBitcoinAmountUnit } from 'src/hooks/wallet/useBitcoinAmountUnit';

export const useTradingSellTradeActions = () => {
    const { analytics } = useServices(selectDesktopAnalyticsDep);
    const dispatch = useDispatch();
    const { translationString } = useTranslation();

    const selectedQuote = useSelector(selectTradingSellSelectedQuote);
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

    return {
        account,
        confirmTrade,
        addBankAccount,
        sendTransaction,
    };
};

export type TradingSellTradeActionsValues = ReturnType<typeof useTradingSellTradeActions>;
