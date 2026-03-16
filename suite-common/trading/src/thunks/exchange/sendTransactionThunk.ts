import { isRejectedWithValue } from '@reduxjs/toolkit';
import { type ExchangeTrade } from 'invity-api';

import { createThunk } from '@suite-common/redux-utils';
import { convertAmountUnitsToSubunits } from '@suite-common/wallet-utils';

import {
    type SendDexTransactionThunkProps,
    sendDexTransactionThunk,
} from './sendDexTransactionThunk';
import { TRADING_EXCHANGE_THUNK_PREFIX } from '../../constants';
import { tradingExchangeActions } from '../../reducers/exchangeReducer';
import { tradingActions } from '../../reducers/tradingCommonReducer';
import {
    selectTradingExchangeAccountKey,
    selectTradingExchangeProviders,
    selectTradingExchangeReceiveAccountKey,
    selectTradingExchangeSelectedQuote,
} from '../../selectors/tradingSelectors';
import { type TradingSendRejectedProps } from '../../types';
import { getTradingFormState } from '../../utils';
import { tradingThunks } from '../common';
import { getSafeRejectedType } from '../common/getSafeRejectedType';

export type SendTransactionThunkProps = {
    trade: ExchangeTrade | undefined;
    decimals: number;
    shouldSendInSats: boolean | undefined;
    isSlip24Active?: boolean;
} & SendDexTransactionThunkProps;

export const sendTransactionThunk = createThunk<
    undefined,
    SendTransactionThunkProps,
    {
        rejectValue: TradingSendRejectedProps;
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
        }: SendTransactionThunkProps,
        { dispatch, getState, rejectWithValue },
    ) => {
        const selectedQuote = selectTradingExchangeSelectedQuote(getState());
        const sendAccountKey = selectTradingExchangeAccountKey(getState());
        const receiveAccountKey = selectTradingExchangeReceiveAccountKey(getState());
        const selectedTrade = trade ?? selectedQuote;
        const providers = selectTradingExchangeProviders(getState());
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
                        nextStep,
                        triggerAnalyticsTradeConfirmation,
                        processResponseData,
                        signAndPushSendFormTransaction,
                        isSlip24Active,
                    }),
                ).unwrap();

                return;
            } catch (error) {
                return rejectWithValue(error);
            }
        }

        if (
            !selectedTrade ||
            !selectedTrade.orderId ||
            !selectedTrade.sendStringAmount ||
            !sendAddress
        ) {
            return rejectWithValue({
                type: 'error',
                error: { id: 'TR_TRADING_CANNOT_SEND_TRANSACTION' },
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

        const sendStringAmount = shouldSendInSats
            ? convertAmountUnitsToSubunits(selectedTrade.sendStringAmount, decimals)
            : selectedTrade.sendStringAmount;
        const sendPaymentExtraId =
            selectedTrade.partnerPaymentExtraId || trade?.partnerPaymentExtraId;
        const recomposeAndSignTx = await dispatch(
            tradingThunks.recomposeAndSignTxThunk({
                account,
                address: sendAddress,
                amount: sendStringAmount,
                destinationTag: sendPaymentExtraId,
                signAndPushSendFormTransaction,
                setMaxOutputId,
                isSlip24Active,
                tradingFormState,
            }),
        );

        if (isRejectedWithValue(recomposeAndSignTx) || !recomposeAndSignTx.payload?.success) {
            const { payload } = recomposeAndSignTx;

            return rejectWithValue({
                type: getSafeRejectedType(payload),
                error:
                    payload && 'error' in payload && 'id' in payload.error
                        ? payload.error
                        : { id: 'TR_TRADING_CANNOT_SEND_TRANSACTION' },
            });
        }

        dispatch(
            tradingActions.saveTrade({
                tradeType: 'exchange',
                date: new Date().toISOString(),
                key: selectedTrade.orderId,
                data: { ...selectedTrade, receiveTxHash: recomposeAndSignTx.payload.payload.txid },
                sendAccountKey,
                receiveAccountKey,
            }),
        );
        dispatch(tradingExchangeActions.saveTransactionId(selectedTrade.orderId));
        nextStep();
    },
);
