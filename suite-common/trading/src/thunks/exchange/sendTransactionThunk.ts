import { isRejected } from '@reduxjs/toolkit';
import { type ExchangeTrade } from 'invity-api';

import { createThunk } from '@trezor/redux-utils';

import { tradingThunks } from '../common';
import {
    type SendDexTransactionThunkProps,
    sendDexTransactionThunk,
} from './sendDexTransactionThunk';
import { TRADING_EXCHANGE_THUNK_PREFIX } from '../../constants';
import { tradingExchangeActions } from '../../reducers/exchangeReducer';
import { type TradingRootState, tradingActions } from '../../reducers/tradingCommonReducer';
import {
    selectTradingExchangeAccountKey,
    selectTradingExchangeProviders,
    selectTradingExchangeReceiveAccountKey,
    selectTradingExchangeSelectedQuote,
} from '../../selectors/tradingSelectors';
import { tradeApi } from '../../tradeApi';
import { type TradingError } from '../../types';
import { getTradingFormState } from '../../utils';
import { toSendTransactionTradingError } from '../../utils/tradingErrorUtils';
import { buildRecomposeInputsFromTrade } from '../common/buildRecomposeInputsFromTrade';

export type SendTransactionThunkProps = {
    trade: ExchangeTrade | undefined;
    decimals: number;
    shouldSendInSats: boolean | undefined;
    isSlip24Active?: boolean;
} & SendDexTransactionThunkProps;

export type SendTransactionThunkState = TradingRootState;

export const sendTransactionThunk = createThunk<
    undefined,
    SendTransactionThunkProps,
    {
        rejectValue: TradingError;
        state: SendTransactionThunkState;
    }
>(
    `${TRADING_EXCHANGE_THUNK_PREFIX}/sendTransaction`,
    async (
        {
            account,
            trade,
            returnUrl,
            setMaxOutputId,
            decimals,
            shouldSendInSats,
            isSlip24Active,
            nextStep,
            processResponseData,
            triggerAnalyticsTradeConfirmation,
            signAndPushSendFormTransaction,
        },
        { dispatch, getState, rejectWithValue },
    ) => {
        const selectedQuote = selectTradingExchangeSelectedQuote(getState());
        const sendAccountKey = selectTradingExchangeAccountKey(getState());
        const receiveAccountKey = selectTradingExchangeReceiveAccountKey(getState());
        const selectedTrade = trade ?? selectedQuote;
        const providers = selectTradingExchangeProviders(getState());
        const apiKey = tradeApi.getCurrentApiKey();
        // sendAddress may be set by useTradingWatchTrade hook to the trade object
        const sendAddress = selectedTrade?.sendAddress;

        dispatch(tradingActions.setModalAccountKey(account.key));

        if (selectedQuote?.isDex) {
            try {
                await dispatch(
                    sendDexTransactionThunk({
                        account,
                        returnUrl,
                        setMaxOutputId,
                        decimals,
                        shouldSendInSats,
                        nextStep,
                        triggerAnalyticsTradeConfirmation,
                        processResponseData,
                        signAndPushSendFormTransaction,
                        isSlip24Active,
                    }),
                ).unwrap();

                return;
            } catch (error) {
                return rejectWithValue(toSendTransactionTradingError(error));
            }
        }

        if (!selectedTrade?.orderId || !selectedTrade.sendStringAmount || !sendAddress) {
            return rejectWithValue({
                type: 'error',
                code: 'cannot-send-transaction',
            });
        }

        const tradingFormState = getTradingFormState({
            activeSection: 'exchange',
            providers,
            trade: selectedTrade,
            isSlip24Active,
            sendAccountKey: account.key,
            receiveAccountKey,
        });

        const recomposeInputs = buildRecomposeInputsFromTrade({
            sendAddress,
            sendStringAmount: selectedTrade.sendStringAmount,
            partnerPaymentExtraId:
                selectedTrade.partnerPaymentExtraId || trade?.partnerPaymentExtraId,
            shouldSendInSats,
            decimals,
        });
        const recomposeAndSignTx = await dispatch(
            tradingThunks.recomposeAndSignTxThunk({
                account,
                ...recomposeInputs,
                signAndPushSendFormTransaction,
                setMaxOutputId,
                isSlip24Active,
                tradingFormState,
            }),
        );

        if (isRejected(recomposeAndSignTx)) {
            return rejectWithValue(
                toSendTransactionTradingError(
                    recomposeAndSignTx.payload ?? recomposeAndSignTx.error,
                ),
            );
        }

        dispatch(
            tradingActions.saveTrade({
                tradeType: 'exchange',
                date: new Date().toISOString(),
                key: selectedTrade.orderId,
                data: { ...selectedTrade, receiveTxHash: recomposeAndSignTx.payload.payload.txid },
                sendAccountKey,
                receiveAccountKey,
                sendTxid: recomposeAndSignTx.payload.payload.txid,
                apiKey,
            }),
        );
        dispatch(tradingExchangeActions.saveTransactionId(selectedTrade.orderId));
        nextStep();
    },
);
