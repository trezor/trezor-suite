import { type SellFiatTrade } from 'invity-api';

import { createThunk } from '@suite-common/redux-utils';
import {
    type TradingFormAccountRootState,
    selectTradingComposedTransactionInfo,
    selectTradingSellInfo,
    selectTradingSellQuotesRequest,
    selectTradingSendAccount,
    sellThunks,
} from '@suite-common/trading';

import { buildSellReturnUrl } from 'src/utils/wallet/trading/buildSellReturnUrl';

import { submitRequestForm } from '../tradingCommonActions';

type RequestSellTradeThunkParams = { quote: SellFiatTrade };

export type RequestSellTradeThunkState = TradingFormAccountRootState;

export const requestSellTradeThunk = createThunk<
    void,
    RequestSellTradeThunkParams,
    { state: RequestSellTradeThunkState }
>('trading/sell/requestTrade', async ({ quote }, { dispatch, getState }) => {
    const account = selectTradingSendAccount(getState(), 'sell');

    if (!account) {
        return;
    }

    const returnUrl = await buildSellReturnUrl({
        quote,
        account,
        sellInfo: selectTradingSellInfo(getState()),
        quotesRequest: selectTradingSellQuotesRequest(getState()),
        composedInfo: selectTradingComposedTransactionInfo(getState()),
    });

    if (!returnUrl) {
        return;
    }

    await dispatch(
        sellThunks.handleTradeThunk({
            account,
            trade: quote,
            returnUrl,
            processResponseData: response => {
                dispatch(submitRequestForm(response.tradeForm?.form));
            },
        }),
    );
});
