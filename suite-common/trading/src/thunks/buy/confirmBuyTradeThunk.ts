import { BuyTradeResponse } from 'invity-api';

import { createThunk } from '@suite-common/redux-utils';
import { notificationsActions } from '@suite-common/toast-notifications';
import { Account } from '@suite-common/wallet-types';

import { TRADING_BUY_THUNK_PREFIX } from '../../constants';
import { invityAPI } from '../../invityAPI';
import { tradingBuyActions } from '../../reducers/buyReducer';
import { tradingActions } from '../../reducers/tradingReducer';
import {
    selectTradingBuyReceiveAccountKey,
    selectTradingBuySelectedQuote,
} from '../../selectors/tradingSelectors';

export type ConfirmTradeThunkProps = {
    returnUrl: string;
    address: string;
    account: Account;

    triggerAnalyticsTradeConfirmation: () => void;
    processResponseData: (response: BuyTradeResponse) => void;
};

export const confirmBuyTradeThunk = createThunk(
    `${TRADING_BUY_THUNK_PREFIX}/confirmTrade`,
    async (
        {
            returnUrl,
            address,
            account,
            triggerAnalyticsTradeConfirmation,
            processResponseData,
        }: ConfirmTradeThunkProps,
        { dispatch, getState },
    ) => {
        const selectedQuote = selectTradingBuySelectedQuote(getState());
        const receiveAccountKey = selectTradingBuyReceiveAccountKey(getState());

        if (!selectedQuote) return;

        dispatch(tradingBuyActions.setIsLoading(true));

        triggerAnalyticsTradeConfirmation();

        const trade = {
            ...selectedQuote,
            receiveAddress: address,
        };

        const response = await invityAPI.doBuyTrade({
            trade,
            returnUrl,
        });

        if (!response || !response.trade || !response.trade.paymentId) {
            dispatch(
                notificationsActions.addToast({
                    type: 'error',
                    error: 'No response from the server',
                }),
            );
        } else if (response.trade.error) {
            dispatch(
                notificationsActions.addToast({
                    type: 'error',
                    error: response.trade.error,
                }),
            );
        } else {
            dispatch(
                tradingActions.saveTrade({
                    tradeType: 'buy',
                    date: new Date().toISOString(),
                    key: response.trade.paymentId,
                    data: response.trade,
                    receiveAccountKey,
                    selectedAccountKey: account.key,
                }),
            );

            // response.tradeForm.form should be processed in this callback
            processResponseData(response);
        }

        dispatch(tradingBuyActions.setIsLoading(false));
    },
);
