import { type BankAccount } from 'invity-api';

import { createThunk } from '@suite-common/redux-utils';

import { type HandleSellTradeThunkProps, handleSellTradeThunk } from './handleSellTradeThunk';
import { TRADING_SELL_THUNK_PREFIX } from '../../constants';
import { tradingSellActions } from '../../reducers/sellReducer';
import { selectTradingSellSelectedQuote } from '../../selectors/tradingSelectors';

export type ConfirmSellTradeThunkProps = {
    bankAccount: BankAccount;
    triggerAnalyticsTradeConfirmation: () => void;
} & Omit<HandleSellTradeThunkProps, 'trade'>;

export const confirmSellTradeThunk = createThunk(
    `${TRADING_SELL_THUNK_PREFIX}/confirmTrade`,
    async (
        {
            account,
            bankAccount,
            returnUrl,
            triggerAnalyticsTradeConfirmation,
            processResponseData,
        }: ConfirmSellTradeThunkProps,
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

        dispatch(tradingSellActions.saveSelectedQuote(response));
        dispatch(tradingSellActions.setFormStep('SEND_TRANSACTION'));
    },
);
