import { isRejected } from '@reduxjs/toolkit';
import { type SellFiatTrade } from 'invity-api';

import { type Account } from '@suite-common/wallet-types';
import { createThunk } from '@trezor/redux-utils';

import { TRADING_SELL_THUNK_PREFIX } from '../../constants';
import { tradingSellActions } from '../../reducers/sellReducer';
import { type TradingRootState, tradingActions } from '../../reducers/tradingCommonReducer';
import {
    selectTradingSellProviders,
    selectTradingSellSelectedQuote,
    selectTradingTradeApiKey,
} from '../../selectors/tradingSelectors';
import { tradeApi } from '../../tradeApi';
import { type TradingError } from '../../types';
import { getTradingFormState } from '../../utils';
import { toSendTransactionTradingError } from '../../utils/tradingErrorUtils';
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

export type SendSellTransactionThunkState = TradingRootState;

export const sendSellTransactionThunk = createThunk<
    undefined,
    SendSellTransactionThunkProps,
    { rejectValue: TradingError; state: SendSellTransactionThunkState }
>(
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
        },
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
                code: 'cannot-send-transaction',
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

        if (isRejected(recomposeAndSignTx)) {
            return rejectWithValue(
                toSendTransactionTradingError(
                    recomposeAndSignTx.payload ?? recomposeAndSignTx.error,
                ),
            );
        }

        // send txid to the server as confirmation
        const { txid } = recomposeAndSignTx.payload.payload;
        const tradeRequest: SellFiatTrade = {
            ...selectedTrade,
            txid,
            destinationAddress,
            destinationPaymentExtraId,
        };

        const apiKey =
            selectTradingTradeApiKey(getState(), selectedTrade.orderId) ??
            tradeApi.getCurrentApiKey();
        const response = await tradeApi.doSellConfirm(tradeRequest, apiKey);

        if (!response) {
            return rejectWithValue({
                type: 'error',
                code: 'no-response',
            });
        }

        if (response.error || !response.status || !response.orderId) {
            return rejectWithValue({
                type: 'error',
                code: 'invalid-response',
                cause: response.error ? { source: 'invity', message: response.error } : undefined,
            });
        }

        dispatch(
            tradingActions.saveTrade({
                tradeType: 'sell',
                date: new Date().toISOString(),
                key: response.orderId,
                data: response,
                sendAccountKey: account.key,
                apiKey,
            }),
        );
        dispatch(tradingSellActions.saveTransactionId(selectedTrade.orderId));
        nextStep();
    },
);
