import { type BankAccount, type SellFiatTrade } from 'invity-api';

import { createThunk } from '@trezor/redux-utils';

import {
    type HandleSellTradeThunkProps,
    type HandleSellTradeThunkState,
    handleSellTradeThunk,
} from './handleSellTradeThunk';
import { TRADING_SELL_THUNK_PREFIX } from '../../constants';
import { tradingSellActions } from '../../reducers/sellReducer';
import { tradingActions } from '../../reducers/tradingCommonReducer';
import { selectTradingSellSelectedQuote } from '../../selectors/tradingSelectors';

export type ConfirmSellTradeThunkProps = {
    bankAccount: BankAccount;
    triggerAnalyticsTradeConfirmation: () => void;
} & Omit<HandleSellTradeThunkProps, 'trade'>;

export type ConfirmSellTradeThunkState = HandleSellTradeThunkState;

export const confirmSellTradeThunk = createThunk<
    SellFiatTrade | undefined,
    ConfirmSellTradeThunkProps,
    { state: ConfirmSellTradeThunkState }
>(
    `${TRADING_SELL_THUNK_PREFIX}/confirmTrade`,
    async (
        { account, bankAccount, returnUrl, triggerAnalyticsTradeConfirmation, processResponseData },
        { dispatch, getState },
    ) => {
        const selectedQuote = selectTradingSellSelectedQuote(getState());

        if (!selectedQuote) return;

        triggerAnalyticsTradeConfirmation();

        const trade = { ...selectedQuote, bankAccount };
        const response = await dispatch(
            handleSellTradeThunk({
                account,
                trade,
                returnUrl,
                processResponseData,
            }),
        ).unwrap();

        if (!response) return;

        const confirmedTrade: SellFiatTrade = {
            bankAccount,
            bankAccounts: selectedQuote.bankAccounts,
            ...response,
        };

        if (confirmedTrade.orderId) {
            dispatch(
                tradingActions.saveTrade({
                    tradeType: 'sell',
                    data: confirmedTrade,
                    date: new Date().toISOString(),
                    key: confirmedTrade.orderId,
                    sendAccountKey: account.key,
                }),
            );
            dispatch(tradingSellActions.saveTransactionId(confirmedTrade.orderId));
        }

        dispatch(tradingSellActions.saveSelectedQuote(confirmedTrade));
        dispatch(tradingSellActions.setFormStep('SEND_TRANSACTION'));

        return confirmedTrade;
    },
);
