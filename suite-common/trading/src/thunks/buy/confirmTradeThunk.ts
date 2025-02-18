import { BuyTradeResponse } from 'invity-api';

import { createThunk } from '@suite-common/redux-utils';
import { notificationsActions } from '@suite-common/toast-notifications';
import { Account } from '@suite-common/wallet-types';
import { EventType, analytics } from '@trezor/suite-analytics';

import { BUY_THUNK_COMMON_PREFIX } from './handleRequestThunk';
import { tradingActions } from '../../actions/tradingActions';
import { invityAPI } from '../../invityAPI';
import { tradingBuyActions } from '../../reducers/buyReducer';
import { selectTradingBuySelectedQuote } from '../../selectors/tradingSelectors';

export type ConfirmTradeThunkProps = {
    returnUrl: string;
    address: string;
    account: Account;

    processResponseData: (response: BuyTradeResponse) => void;
};

export const confirmTradeThunk = createThunk(
    `${BUY_THUNK_COMMON_PREFIX}/confirmTrade`,
    async (
        { returnUrl, address, account, processResponseData }: ConfirmTradeThunkProps,
        { dispatch, getState },
    ) => {
        const selectedQuote = selectTradingBuySelectedQuote(getState());

        if (!selectedQuote) return;

        dispatch(tradingBuyActions.setIsLoading(true));

        analytics.report({
            type: EventType.TradingConfirmTrade,
            payload: {
                type: 'buy',
            },
        });

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
                    account: {
                        descriptor: account.descriptor,
                        symbol: account.symbol,
                        accountType: account.accountType,
                        accountIndex: account.index,
                    },
                    data: response.trade,
                }),
            );

            // response.tradeForm.form should be processed in this callback
            processResponseData(response);
        }

        dispatch(tradingBuyActions.setIsLoading(false));
    },
);
