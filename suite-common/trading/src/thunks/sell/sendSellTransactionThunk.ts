import { isRejectedWithValue } from '@reduxjs/toolkit';
import { SellFiatTrade } from 'invity-api';

import { createThunk } from '@suite-common/redux-utils';
import { Account } from '@suite-common/wallet-types';
import { amountToSmallestUnit } from '@suite-common/wallet-utils';

import { tradingThunks } from '../';
import { TRADING_SELL_THUNK_PREFIX } from '../../constants';
import { invityAPI } from '../../invityAPI';
import { tradingSellActions } from '../../reducers/sellReducer';
import { tradingActions } from '../../reducers/tradingReducer';
import {
    selectTradingSellInfo,
    selectTradingSellSelectedQuote,
} from '../../selectors/tradingSelectors';
import { TradingSellFormProps } from '../../types';
import { RecomposeAndSignTxThunkProps } from '../common/recomposeAndSignTxThunk';

export type SendSellTransactionThunkProps = {
    account: Account;
    trade: SellFiatTrade | undefined;
    shouldSendInSats: boolean | undefined;
    decimals: number;
    formValues: TradingSellFormProps;

    nextStep: () => void;
    signAndPushSendFormTransaction: RecomposeAndSignTxThunkProps['signAndPushSendFormTransaction'];
};

export const sendSellTransactionThunk = createThunk(
    `${TRADING_SELL_THUNK_PREFIX}/sendTransaction`,
    async (
        {
            account,
            trade,
            shouldSendInSats,
            decimals,
            formValues,
            nextStep,
            signAndPushSendFormTransaction,
        }: SendSellTransactionThunkProps,
        { dispatch, getState, rejectWithValue },
    ) => {
        const selectedQuote = selectTradingSellSelectedQuote(getState());
        const sellInfo = selectTradingSellInfo(getState());
        const selectedTrade = trade ?? selectedQuote;
        // destinationAddress may be set by useTradingWatchTrade hook to the trade object
        const destinationAddress = selectedTrade?.destinationAddress ?? trade?.destinationAddress;
        const lockSendAmount =
            !!sellInfo?.providerInfos[selectedTrade?.exchange ?? '']?.lockSendAmount;

        dispatch(tradingActions.setModalAccountKey(account.key));

        if (
            !selectedTrade ||
            !selectedTrade.orderId ||
            !destinationAddress ||
            !selectedTrade.cryptoStringAmount
        ) {
            return rejectWithValue({
                type: 'error',
                error: { id: 'TR_TRADING_CANNOT_SEND_TRANSACTION' },
            });
        }

        const cryptoStringAmount = shouldSendInSats
            ? amountToSmallestUnit(selectedTrade.cryptoStringAmount, decimals)
            : selectedTrade.cryptoStringAmount;
        const { destinationPaymentExtraId } = selectedTrade;

        const recomposeAndSignTx = await dispatch(
            tradingThunks.recomposeAndSignTxThunk({
                account,
                address: destinationAddress,
                amount: cryptoStringAmount,
                destinationTag: destinationPaymentExtraId,
                signAndPushSendFormTransaction,
                // when lockSendAmount is true, the amount should not be recomputed based on the maximum balance.
                setMaxOutputId: lockSendAmount ? undefined : formValues.setMaxOutputId,
            }),
        );

        if (isRejectedWithValue(recomposeAndSignTx) || !recomposeAndSignTx.payload?.success) {
            const { payload } = recomposeAndSignTx;

            return rejectWithValue({
                type: payload && 'type' in payload ? payload.type : 'sign-tx-error',
                error:
                    payload && 'error' in payload
                        ? payload.error
                        : { id: 'TR_TRADING_CANNOT_SEND_TRANSACTION' },
            });
        }

        // send txid to the server as confirmation
        const { txid } = recomposeAndSignTx.payload.payload;
        const tradeRequest: SellFiatTrade = {
            ...selectedTrade,
            txid,
            destinationAddress,
            destinationPaymentExtraId,
        };

        const response = await invityAPI.doSellConfirm(tradeRequest);

        if (!response) {
            return rejectWithValue({
                type: 'error',
                error: { id: 'TR_TRADING_NO_RESPONSE' },
            });
        }

        if (response.error || !response.status || !response.orderId) {
            return rejectWithValue({
                type: 'error',
                error: {
                    id: 'TR_TRADING_INVALID_RESPONSE',
                    values: response.error && { error: `(${response.error})` },
                },
            });
        }

        dispatch(
            tradingActions.saveTrade({
                tradeType: 'sell',
                date: new Date().toISOString(),
                key: response.orderId,
                data: response,
                sendAccountKey: account.key,
            }),
        );
        dispatch(tradingSellActions.saveTransactionId(selectedTrade.orderId));
        nextStep();
    },
);
