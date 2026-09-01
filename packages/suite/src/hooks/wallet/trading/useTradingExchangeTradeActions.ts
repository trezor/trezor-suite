import type { ExchangeTrade } from 'invity-api';

import { useDevice } from '@suite/device';
import { type TranslationKey, useTranslation } from '@suite/intl';
import { selectHasExperimentalFeature } from '@suite/settings';
import { Feature, selectIsFeatureEnabled } from '@suite-common/message-system';
import { useDispatch } from '@suite-common/redux-utils';
import { notificationsActions } from '@suite-common/toast-notifications';
import {
    type TradingSignAndPushSendFormTransactionProps,
    exchangeThunks,
    isSendRejectedError,
    isSilentSendRejection,
    selectTradingExchange,
    selectTradingExchangeActiveTrade,
    selectTradingExchangeSelectedQuote,
    selectTradingIsSlip24Allowed,
} from '@suite-common/trading';
import { selectAccountByKey } from '@suite-common/wallet-core';

import { signAndPushSendFormTransactionThunk } from 'src/actions/wallet/send/sendFormThunks';
import { useSelector } from 'src/hooks/suite';
import { useTradingAssetDecimals } from 'src/hooks/wallet/trading/form/common/useTradingAssetDecimals';
import { useTradingExchangeTradeRequest } from 'src/hooks/wallet/trading/form/common/useTradingExchangeTradeRequest';
import { useTradingFormAccount } from 'src/hooks/wallet/trading/form/useTradingFormAccount';
import { useBitcoinAmountUnit } from 'src/hooks/wallet/useBitcoinAmountUnit';
import { type TradingExchangeConfirmTradeProps } from 'src/types/trading/tradingForm';

export const useTradingExchangeTradeActions = () => {
    const dispatch = useDispatch();
    const { translationString } = useTranslation();
    const { device } = useDevice();

    const selectedQuote = useSelector(selectTradingExchangeSelectedQuote);
    const trade = useSelector(selectTradingExchangeActiveTrade);
    const { extraField } = useSelector(selectTradingExchange);

    const { account: formAccount } = useTradingFormAccount('exchange');
    const tradeSendAccount = useSelector(
        state => selectAccountByKey(state, trade?.sendAccountKey) ?? undefined,
    );
    const account = tradeSendAccount ?? formAccount;

    const { isBtcSatsAmountUnit: shouldSendInSats } = useBitcoinAmountUnit(account?.symbol);

    const { getAssetDecimals } = useTradingAssetDecimals();
    const exchangeCryptoId = (trade?.data ?? selectedQuote)?.send;
    const decimals = getAssetDecimals({ accountKey: account?.key, cryptoId: exchangeCryptoId });

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

    const { getTradeRequestParams } = useTradingExchangeTradeRequest(account);

    const confirmTrade = async ({
        receiveAddress,
        trade: confirmedTrade,
        approvalFlow,
        ...props
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
                extraField: props.extraField ?? extraField,
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
                    // TODO: slip24 - exclude from debug mode
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

    return {
        account,
        confirmTrade,
        sendTransaction,
        signDataAndConfirm,
    };
};

export type TradingExchangeTradeActionsValues = ReturnType<typeof useTradingExchangeTradeActions>;
