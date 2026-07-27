import { type SellFiatTrade } from 'invity-api';

import { createThunk } from '@suite-common/redux-utils';
import {
    selectTradingComposedTransactionInfo,
    selectTradingSellInfo,
    selectTradingSellQuotesRequest,
    selectTradingSendAccount,
    sellThunks,
} from '@suite-common/trading';

import { buildSellReturnUrl } from 'src/utils/wallet/trading/buildSellReturnUrl';

import { submitRequestForm } from '../tradingCommonActions';

export const requestSellTradeThunk = createThunk(
    'trading/sell/requestTrade',
    async ({ quote }: { quote: SellFiatTrade }, { dispatch, getState }) => {
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
    },
);
