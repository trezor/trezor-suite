import { type BankAccount } from 'invity-api';

import { createThunk } from '@suite-common/redux-utils';

import {
    type HandleSellTradeThunkProps,
    type HandleSellTradeThunkState,
    handleSellTradeThunk,
} from './handleSellTradeThunk';
import { TRADING_SELL_THUNK_PREFIX } from '../../constants';
import { tradingSellActions } from '../../reducers/sellReducer';
import { selectTradingSellSelectedQuote } from '../../selectors/tradingSelectors';

export type ConfirmSellTradeThunkProps = {
    bankAccount: BankAccount;
    triggerAnalyticsTradeConfirmation: () => void;
} & Omit<HandleSellTradeThunkProps, 'trade'>;

type ConfirmSellTradeThunkState = HandleSellTradeThunkState;

export const confirmSellTradeThunk = createThunk<
    void,
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

        dispatch(tradingSellActions.saveSelectedQuote(response));
        dispatch(tradingSellActions.setFormStep('SEND_TRANSACTION'));
    },
);
