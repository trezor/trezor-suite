import { useSelector } from 'react-redux';

import type { ExchangeTrade } from 'invity-api';

import { useDevice } from '@suite/device';
import { type TranslationKey, useTranslation } from '@suite/intl';
import { selectHasExperimentalFeature } from '@suite/settings';
import { type DeviceRootState } from '@suite-common/device';
import {
    Feature,
    type MessageSystemRootState,
    selectIsFeatureEnabled,
} from '@suite-common/message-system';
import { notificationsActions } from '@suite-common/toast-notifications';
import {
    type TradingSignAndPushSendFormTransactionProps,
    exchangeThunks,
    isSendRejectedError,
    isSilentSendRejection,
    selectTradingExchangeActiveTrade,
    selectTradingExchangeSelectedQuote,
    selectTradingExchangeSelectedQuoteTimestamp,
    selectTradingIsSlip24Allowed,
    tradingExchangeActions,
} from '@suite-common/trading';
import { type AccountsRootState, selectAccountByKey } from '@suite-common/wallet-core';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';

import { signAndPushSendFormTransactionThunk } from 'src/actions/wallet/send/sendFormThunks';
import { useTradingAssetDecimals } from 'src/hooks/wallet/trading/form/common/useTradingAssetDecimals';
import { useTradingExchangeTradeRequest } from 'src/hooks/wallet/trading/form/common/useTradingExchangeTradeRequest';
import { useTradingFormAccount } from 'src/hooks/wallet/trading/form/useTradingFormAccount';
import { useBitcoinAmountUnit } from 'src/hooks/wallet/useBitcoinAmountUnit';
import { type TradingExchangeConfirmTradeProps } from 'src/types/trading/tradingForm';

export const useTradingExchangeTradeActions = () => {
    const { dispatch } = useServices(injectDispatch);
    const { translationString } = useTranslation();
    const { device } = useDevice();

    const selectedQuote = useSelector(selectTradingExchangeSelectedQuote);
    const selectedQuoteTimestamp = useSelector(selectTradingExchangeSelectedQuoteTimestamp);
    const trade = useSelector(selectTradingExchangeActiveTrade);

    const { account: formAccount } = useTradingFormAccount('exchange');
    const tradeSendAccount = useSelector(
        (state: AccountsRootState) => selectAccountByKey(state, trade?.sendAccountKey) ?? undefined,
    );
    const account = tradeSendAccount ?? formAccount;

    const { isBtcSatsAmountUnit: shouldSendInSats } = useBitcoinAmountUnit(account?.symbol);

    const { getAssetDecimals } = useTradingAssetDecimals();
    const exchangeCryptoId = (trade?.data ?? selectedQuote)?.send;
    const decimals = getAssetDecimals({ accountKey: account?.key, cryptoId: exchangeCryptoId });

    const isSlip24FeatureEnabled = useSelector((state: MessageSystemRootState) =>
        selectIsFeatureEnabled(state, Feature.trading.slip24, true),
    );
    const isSlip24ExperimentalFeatureEnabled = useSelector(selectHasExperimentalFeature('slip24'));
    const isSlip24Active = useSelector((state: DeviceRootState) =>
        account
            ? selectTradingIsSlip24Allowed(
                  state,
                  account,
                  isSlip24FeatureEnabled && isSlip24ExperimentalFeatureEnabled,
              )
            : false,
    );

    const { getTradeRequestParams } = useTradingExchangeTradeRequest(account);

    const confirmTrade = async ({
        receiveAddress,
        trade: confirmedTrade,
        approvalFlow,
    }: TradingExchangeConfirmTradeProps): Promise<ExchangeTrade | undefined> => {
        if (!account) {
            return undefined;
        }

        const commonFunctions = await getTradeRequestParams(confirmedTrade);

        if (!commonFunctions) {
            return undefined;
        }

        const { returnUrl, triggerAnalyticsTradeConfirmation, processResponseData, nextStep } =
            commonFunctions;

        return await dispatch(
            exchangeThunks.confirmTradeThunk({
                returnUrl,
                receiveAddress,
                account,
                trade: confirmedTrade,
                approvalFlow,
                triggerAnalyticsTradeConfirmation,
                processResponseData,
                nextStep,
            }),
        ).unwrap();
    };

    const sendTransaction = async () => {
        if (!account) {
            return false;
        }

        const commonFunctions = await getTradeRequestParams(trade?.data);

        if (!commonFunctions) {
            return false;
        }

        const { returnUrl, triggerAnalyticsTradeConfirmation, processResponseData, nextStep } =
            commonFunctions;

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
                exchangeThunks.sendTransactionThunk({
                    account,
                    trade: trade?.data,
                    returnUrl,
                    setMaxOutputId: undefined,
                    decimals,
                    shouldSendInSats,
                    isSlip24Active,
                    nextStep,
                    processResponseData,
                    triggerAnalyticsTradeConfirmation,
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

    const signDataAndConfirm = async () => {
        if (!account) {
            return;
        }

        const commonFunctions = await getTradeRequestParams(trade?.data);

        if (!commonFunctions) {
            return;
        }

        const { returnUrl, triggerAnalyticsTradeConfirmation, processResponseData, nextStep } =
            commonFunctions;

        await dispatch(
            exchangeThunks.signDataAndConfirmThunk({
                account,
                device,
                returnUrl,
                triggerAnalyticsTradeConfirmation,
                processResponseData,
                nextStep,
            }),
        );
    };

    const refreshSelectedQuote = async () => {
        const receiveAddress = selectedQuote?.receiveAddress;

        if (!account || !selectedQuote || !receiveAddress) {
            return false;
        }

        let isConfirmed = false;
        try {
            const freshQuote = await dispatch(
                exchangeThunks.fetchSelectedProviderQuoteThunk(),
            ).unwrap();
            const commonFunctions = await getTradeRequestParams(freshQuote);

            if (!commonFunctions) {
                return false;
            }

            const { returnUrl, processResponseData, nextStep } = commonFunctions;
            const confirmedTrade = await dispatch(
                exchangeThunks.confirmTradeThunk({
                    returnUrl,
                    receiveAddress,
                    account,
                    trade: {
                        ...freshQuote,
                        swapSlippage: selectedQuote.swapSlippage ?? freshQuote.swapSlippage,
                    },
                    // The confirmation was already reported when the offer was chosen.
                    triggerAnalyticsTradeConfirmation: () => {},
                    processResponseData,
                    nextStep,
                }),
            ).unwrap();

            isConfirmed = !!confirmedTrade;
        } catch (e) {
            if (isSendRejectedError<TranslationKey>(e) && !isSilentSendRejection(e.type)) {
                dispatch(
                    notificationsActions.addToast({
                        type: e.type,
                        error: translationString(e.error.id, e.error.values),
                    }),
                );
            }
        }

        if (!isConfirmed) {
            dispatch(tradingExchangeActions.saveSelectedQuote(selectedQuote));
            if (selectedQuoteTimestamp !== undefined) {
                dispatch(tradingExchangeActions.setSelectedQuoteTimestamp(selectedQuoteTimestamp));
            }
        }

        return isConfirmed;
    };

    return {
        account,
        confirmTrade,
        refreshSelectedQuote,
        sendTransaction,
        signDataAndConfirm,
    };
};
