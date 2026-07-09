import { type BuyTrade } from 'invity-api';

import { asTypedDesktopAnalytics, events } from '@suite/analytics';
import { goto } from '@suite/router';
import { createThunk } from '@suite-common/redux-utils';
import {
    buyThunks,
    cryptoIdToNetworkSymbolAndContractAddress,
    selectTradingBuyInfo,
    selectTradingBuyQuotesRequest,
    selectTradingBuyReceiveAddress,
    selectTradingCoinInfoByCryptoId,
    selectTradingFormAccount,
} from '@suite-common/trading';

import { createQuoteLink } from 'src/utils/wallet/trading/buyUtils';

import { submitRequestForm } from '../tradingCommonActions';

export const selectBuyQuoteThunk = createThunk(
    'trading/buy/selectQuoteWithAnalytics',
    async ({ quote }: { quote: BuyTrade }, { dispatch, getState, extra }) => {
        const buyInfo = selectTradingBuyInfo(getState());
        const quotesRequest = selectTradingBuyQuotesRequest(getState());
        const receiveAddress = selectTradingBuyReceiveAddress(getState());
        const account = selectTradingFormAccount(getState(), 'buy');

        const provider = buyInfo && quote.exchange ? buyInfo.providerInfos[quote.exchange] : null;

        if (!quotesRequest || !provider || !receiveAddress) return;

        const returnUrl = await createQuoteLink(
            { ...quotesRequest, paymentMethod: quote.paymentMethod },
            account,
        );

        const { symbol: cryptoNetworkSymbol, contractAddress: cryptoContractAddress } =
            cryptoIdToNetworkSymbolAndContractAddress(quotesRequest.receiveCurrency);
        const cryptoLabel = selectTradingCoinInfoByCryptoId(
            getState(),
            quotesRequest.receiveCurrency,
        )?.name;

        asTypedDesktopAnalytics(extra.services.analytics).report({
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
    },
);
