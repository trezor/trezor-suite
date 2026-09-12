import { type SellFiatTrade } from 'invity-api';

import { type WithServices, createThunk } from '@suite-common/redux-utils';
import {
    type TradingFormAccountRootState,
    selectTradingComposedTransactionInfo,
    selectTradingSellInfo,
    selectTradingSellQuotesRequest,
    selectTradingSendAccount,
    sellThunks,
} from '@suite-common/trading';
import { type DesktopApiDep } from '@trezor/suite-desktop-api';

import { buildSellReturnUrl } from 'src/utils/wallet/trading/buildSellReturnUrl';

import { submitRequestFormThunk } from '../tradingCommonActions';

type RequestSellTradeThunkParams = { quote: SellFiatTrade };

export type RequestSellTradeThunkState = TradingFormAccountRootState;

type RequestSellTradeThunkDeps = WithServices<DesktopApiDep<'getHttpReceiverAddress'>>;

export const requestSellTradeThunk = createThunk<
    void,
    RequestSellTradeThunkParams,
    { state: RequestSellTradeThunkState; extra: RequestSellTradeThunkDeps }
>('trading/sell/requestTrade', async ({ quote }, { dispatch, getState, extra }) => {
    const account = selectTradingSendAccount(getState(), 'sell');

    if (!account) {
        return;
    }

    const returnUrl = await buildSellReturnUrl({
        desktopApi: extra.services.desktopApi,
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
                dispatch(submitRequestFormThunk(response.tradeForm?.form));
            },
        }),
    );
});
