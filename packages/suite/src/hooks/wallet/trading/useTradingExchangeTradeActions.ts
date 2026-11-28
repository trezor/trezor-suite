import { useSelector } from 'react-redux';

import type { ExchangeTrade } from 'invity-api';

import { WALLET_MISMATCH_ERROR_CODE } from '@suite/device';
import { selectHasExperimentalFeature } from '@suite/settings';
import { type DeviceRootState, selectSelectedDevice } from '@suite-common/device';
import {
    Feature,
    type MessageSystemRootState,
    selectIsFeatureEnabled,
} from '@suite-common/message-system';
import { notificationsActions } from '@suite-common/toast-notifications';
import {
    type TradingBridgeSpeed,
    type TradingSignAndPushSendFormTransactionProps,
    exchangeThunks,
    isTradingError,
    selectTradingExchangeActiveTrade,
    selectTradingExchangeQuotesRequest,
    selectTradingExchangeSelectedQuote,
    selectTradingExchangeSelectedQuoteTimestamp,
    selectTradingIsSlip24Allowed,
    tradingExchangeActions,
    withQuotesRequestBridgeSpeed,
} from '@suite-common/trading';
import { type AccountsRootState, selectAccountByKey } from '@suite-common/wallet-core';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch, injectGetState } from '@trezor/redux-utils';

import { signAndPushSendFormTransactionThunk } from '#src/actions/wallet/send/sendFormThunks';
import { useTradingAssetDecimals } from '#src/hooks/wallet/trading/form/common/useTradingAssetDecimals';
import { useTradingExchangeTradeRequest } from '#src/hooks/wallet/trading/form/common/useTradingExchangeTradeRequest';
import { useTradingFormAccount } from '#src/hooks/wallet/trading/form/useTradingFormAccount';
import { useBitcoinAmountUnit } from '#src/hooks/wallet/useBitcoinAmountUnit';
import { type TradingExchangeConfirmTradeProps } from '#src/types/trading/tradingForm';

import { useTradingErrorToast } from './useTradingErrorToast';

export const useTradingExchangeTradeActions = () => {
    const { dispatch, getState } = useServices(injectDispatch, injectGetState);
    const { showTradingErrorToast } = useTradingErrorToast();

    const selectedQuote = useSelector(selectTradingExchangeSelectedQuote);
    const selectedQuoteTimestamp = useSelector(selectTradingExchangeSelectedQuoteTimestamp);
    const quotesRequest = useSelector(selectTradingExchangeQuotesRequest);
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
            if (!isTradingError(e)) {
                return false;
            }

            showTradingErrorToast(e);

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

        const device = selectSelectedDevice(getState());
        if (!device?.connected || !device.available) {
            showTradingErrorToast({ type: 'sign-tx-error', code: 'device-not-connected' });

            return;
        }

        if (device.state?.staticSessionId !== account.deviceState) {
            dispatch(
                notificationsActions.addToast({
                    type: 'sign-tx-error',
                    error: WALLET_MISMATCH_ERROR_CODE,
                }),
            );

            return;
        }

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
            )
                .unwrap()
                .catch(() => undefined); // TODO: #34979 will remove toasts from thunks and this catch will be removed as well

            isConfirmed = !!confirmedTrade;
        } catch (e) {
            if (isTradingError(e)) {
                showTradingErrorToast(e);
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

    const changeBridgeSpeed = async (bridgeSpeed: TradingBridgeSpeed) => {
        if (!quotesRequest) {
            return false;
        }

        dispatch(tradingExchangeActions.setIsLoading(true));
        dispatch(
            tradingExchangeActions.saveQuoteRequest(
                withQuotesRequestBridgeSpeed({ request: quotesRequest, bridgeSpeed }),
            ),
        );

        const isConfirmed = await refreshSelectedQuote();

        if (!isConfirmed) {
            dispatch(tradingExchangeActions.saveQuoteRequest(quotesRequest));
        }
        dispatch(tradingExchangeActions.setIsLoading(false));

        return isConfirmed;
    };

    return {
        account,
        changeBridgeSpeed,
        confirmTrade,
        refreshSelectedQuote,
        sendTransaction,
        signDataAndConfirm,
    };
};
