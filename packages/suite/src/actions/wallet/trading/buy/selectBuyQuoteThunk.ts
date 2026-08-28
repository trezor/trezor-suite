import { type BuyTrade } from 'invity-api';

import { type DesktopAnalyticsDep, events } from '@suite/analytics';
import { type GotoThunkDeps, type GotoThunkState, goto } from '@suite/router';
import { type WithServices, createThunk } from '@suite-common/redux-utils';
import {
    type TradingFormAccountRootState,
    buyThunks,
    cryptoIdToNetworkSymbolAndContractAddress,
    selectTradingBuyInfo,
    selectTradingBuyQuotesRequest,
    selectTradingBuyReceiveAccount,
    selectTradingBuyReceiveAddress,
    selectTradingCoinInfoByCryptoId,
    selectTradingFormAccount,
} from '@suite-common/trading';

import { createQuoteLink } from 'src/utils/wallet/trading/buyUtils';

import { submitRequestForm } from '../tradingCommonActions';

type SelectBuyQuoteThunkParams = { quote: BuyTrade };
type SelectBuyQuoteThunkState = GotoThunkState & TradingFormAccountRootState;

type SelectBuyQuoteThunkDeps = GotoThunkDeps & WithServices<DesktopAnalyticsDep>;

export const selectBuyQuoteThunk = createThunk<
    void,
    SelectBuyQuoteThunkParams,
    { state: SelectBuyQuoteThunkState; extra: SelectBuyQuoteThunkDeps }
>('trading/buy/selectQuoteWithAnalytics', async ({ quote }, { dispatch, getState, extra }) => {
    const buyInfo = selectTradingBuyInfo(getState());
    const quotesRequest = selectTradingBuyQuotesRequest(getState());
    const receiveAddress = selectTradingBuyReceiveAddress(getState());
    const account = selectTradingFormAccount(getState(), 'buy');
    const receiveAccount = selectTradingBuyReceiveAccount(getState());

    const provider = buyInfo && quote.exchange ? buyInfo.providerInfos[quote.exchange] : null;

    if (!quotesRequest || !provider || !receiveAddress || !account) {
        return;
    }

    const returnUrl = await createQuoteLink(
        { ...quotesRequest, paymentMethod: quote.paymentMethod },
        receiveAccount ?? account,
    );

    const { symbol: cryptoNetworkSymbol, contractAddress: cryptoContractAddress } =
        cryptoIdToNetworkSymbolAndContractAddress(quotesRequest.receiveCurrency);
    const cryptoLabel = selectTradingCoinInfoByCryptoId(
        getState(),
        quotesRequest.receiveCurrency,
    )?.name;

    extra.services.analytics.report({
        type: events.tradeBuyEvent.name,
        payload: {
            action: 'continue',
            step: 'buy-form',
            cryptoLabel,
            cryptoNetworkSymbol,
            cryptoContractAddress,
            exchangeName: quote.exchange,
            paymentMethod: quote.paymentMethod,
            countryOfResidence: quotesRequest.country,
        },
    });

    await dispatch(
        buyThunks.selectQuoteThunk({
            quote,
            returnUrl,
            loginRequest: form => {
                dispatch(submitRequestForm(form));
            },
            nextStep: () => {
                dispatch(goto({ routeName: 'wallet-trading-buy-confirm' }));
            },
        }),
    );
});
