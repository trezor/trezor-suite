import { type BuyTrade, type BuyTradeResponse } from 'invity-api';

import { createThunk } from '@suite-common/redux-utils';
import { type Account } from '@suite-common/wallet-types';

import { TRADING_BUY_THUNK_PREFIX } from '../../constants';
import { invityAPI } from '../../invityAPI';
import { tradingBuyActions } from '../../reducers/buyReducer';
import { tradingActions } from '../../reducers/tradingCommonReducer';
import {
    selectTradingBuyReceiveAccountKey,
    selectTradingBuySelectedQuote,
} from '../../selectors/tradingSelectors';
import { logErrorThunk } from '../common/logErrorThunk';

export type ConfirmTradeThunkProps = {
    quote?: BuyTrade;
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
            quote,
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

        const buyTrade = quote ?? selectedQuote;

        if (!buyTrade) {
            return undefined;
        }

        dispatch(tradingBuyActions.setIsLoading(true));

        triggerAnalyticsTradeConfirmation();

        const trade = {
            ...buyTrade,
            receiveAddress: address,
        };

        const response = await invityAPI.doBuyTrade({
            trade,
            returnUrl,
        });

        if (!response || !response.trade || !response.trade.paymentId) {
            dispatch(
                logErrorThunk({
                    errorMessage: 'No response from the server',
                    tradingType: 'buy',
                }),
            );

            dispatch(tradingBuyActions.setIsLoading(false));

            return undefined;
        }

        if (response.trade.error) {
            dispatch(
                logErrorThunk({
                    errorMessage: response.trade.error,
                    tradingType: 'buy',
                }),
            );

            dispatch(tradingBuyActions.setIsLoading(false));

            return undefined;
        }

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

        dispatch(tradingBuyActions.setIsLoading(false));

        return response.trade;
    },
);
