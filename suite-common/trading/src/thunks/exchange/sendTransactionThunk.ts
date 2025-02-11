import { ExchangeTrade } from 'invity-api';

import { createThunk } from '@suite-common/redux-utils';
import { amountToSmallestUnit } from '@suite-common/wallet-utils';

import { exchangeThunks, tradingThunks } from '../';
import { SendDexTransactionThunkProps } from './sendDexTransactionThunk';
import { TRADING_EXCHANGE_THUNK_PREFIX } from '../../constants';
import { tradingExchangeActions } from '../../reducers/exchangeReducer';
import { tradingActions } from '../../reducers/tradingReducer';
import {
    selectTradingExchangeAccountKey,
    selectTradingExchangeReceiveAccountKey,
    selectTradingExchangeSelectedQuote,
} from '../../selectors/tradingSelectors';
import { TradingSendRejectedProps } from '../../types';

export type SendTransactionThunkProps = {
    trade: ExchangeTrade | undefined;
    decimals: number;
    shouldSendInSats: boolean | undefined;
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
        // sendAddress may be set by useTradingWatchTrade hook to the trade object
        const sendAddress = selectedTrade?.sendAddress;

        dispatch(tradingActions.setModalAccountKey(account.key));

        if (selectedQuote?.isDex) {
            try {
                await dispatch(
                    exchangeThunks.sendDexTransactionThunk({
                        account,
                        returnUrl,
                        setMaxOutputId,
                        nextStep,
                        triggerAnalyticsTradeConfirmation,
                        processResponseData,
                        signAndPushSendFormTransaction,
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

        const sendStringAmount = shouldSendInSats
            ? amountToSmallestUnit(selectedTrade.sendStringAmount, decimals)
            : selectedTrade.sendStringAmount;
        const sendPaymentExtraId =
            selectedTrade.partnerPaymentExtraId || trade?.partnerPaymentExtraId;

        const { payload } = await dispatch(
            tradingThunks.recomposeAndSignTxThunk({
                account,
                address: sendAddress,
                amount: sendStringAmount,
                destinationTag: sendPaymentExtraId,
                signAndPushSendFormTransaction,
            }),
        );

        if (!payload || 'error' in payload || !payload.success) {
            return rejectWithValue({
                type: payload && 'type' in payload ? payload.type : 'sign-tx-error',
                error:
                    payload && 'error' in payload
                        ? payload.error
                        : { id: 'TR_TRADING_CANNOT_SEND_TRANSACTION' },
            });
        }

        dispatch(
            tradingActions.saveTrade({
                tradeType: 'exchange',
                date: new Date().toISOString(),
                key: selectedTrade.orderId,
                account: {
                    descriptor: account.descriptor,
                    symbol: account.symbol,
                    accountType: account.accountType,
                    accountIndex: account.index,
                },
                data: selectedTrade,
                sendAccountKey,
                receiveAccountKey,
            }),
        );
        dispatch(tradingExchangeActions.saveTransactionId(selectedTrade.orderId));
        nextStep();
    },
);
