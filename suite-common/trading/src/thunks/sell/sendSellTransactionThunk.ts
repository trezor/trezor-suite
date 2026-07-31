import { isRejectedWithValue } from '@reduxjs/toolkit';
import { type SellFiatTrade } from 'invity-api';

import { createThunk } from '@suite-common/redux-utils';
import { type Account } from '@suite-common/wallet-types';

import { TRADING_SELL_THUNK_PREFIX } from '../../constants';
import { tradingSellActions } from '../../reducers/sellReducer';
import { tradingActions } from '../../reducers/tradingCommonReducer';
import {
    selectTradingSellProviders,
    selectTradingSellSelectedQuote,
} from '../../selectors/tradingSelectors';
import { tradeApi } from '../../tradeApi';
import { getTradingFormState } from '../../utils';
import { tradingThunks } from '../common';
import { buildRecomposeInputsFromTrade } from '../common/buildRecomposeInputsFromTrade';
import { type RecomposeAndSignTxThunkProps } from '../common/recomposeAndSignTxThunk';

export type SendSellTransactionThunkProps = {
    account: Account;
    trade: SellFiatTrade | undefined;
    shouldSendInSats: boolean | undefined;
    decimals: number;
    isSlip24Active?: boolean;

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
            isSlip24Active,
            nextStep,
            signAndPushSendFormTransaction,
        }: SendSellTransactionThunkProps,
        { dispatch, getState, rejectWithValue },
    ) => {
        const selectedQuote = selectTradingSellSelectedQuote(getState());
        const providers = selectTradingSellProviders(getState());
        const selectedTrade = trade ?? selectedQuote;
        // destinationAddress may be set by useTradingWatchTrade hook to the trade object
        const destinationAddress = selectedTrade?.destinationAddress ?? trade?.destinationAddress;

        dispatch(tradingActions.setModalAccountKey(account.key));

        if (!selectedTrade?.orderId || !destinationAddress || !selectedTrade.cryptoStringAmount) {
            return rejectWithValue({
                type: 'error',
                error: { id: 'TR_TRADING_CANNOT_SEND_TRANSACTION' },
            });
        }
        const tradingFormState = getTradingFormState({
            activeSection: 'sell',
            providers,
            trade: selectedTrade,
            isSlip24Active,
            sendAccountKey: account.key,
        });
        const { destinationPaymentExtraId } = selectedTrade;
        const recomposeInputs = buildRecomposeInputsFromTrade({
            destinationAddress,
            cryptoStringAmount: selectedTrade.cryptoStringAmount,
            destinationPaymentExtraId,
            shouldSendInSats,
            decimals,
        });

        const recomposeAndSignTx = await dispatch(
            tradingThunks.recomposeAndSignTxThunk({
                account,
                ...recomposeInputs,
                isSlip24Active,
                signAndPushSendFormTransaction,
                tradingFormState,
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

        const response = await tradeApi.doSellConfirm(tradeRequest);

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
