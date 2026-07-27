import { type ExchangeTrade } from 'invity-api';

import { asTypedDesktopAnalytics, events } from '@suite/analytics';
import { goto } from '@suite/router';
import { createThunk } from '@suite-common/redux-utils';
import {
    cryptoIdToNetworkSymbolAndContractAddress,
    exchangeThunks,
    selectTradingCoinSymbolByCryptoId,
    selectTradingExchangeInfo,
    selectTradingExchangeQuotesRequest,
} from '@suite-common/trading';

type SelectExchangeQuoteThunkProps = {
    quote: ExchangeTrade;
    exchangeType?: string;
    rateType?: string;
    fractionButton?: number;
};

export const selectExchangeQuoteThunk = createThunk(
    'trading/exchange/selectQuoteWithAnalytics',
    async (
        { quote, exchangeType, rateType, fractionButton }: SelectExchangeQuoteThunkProps,
        { dispatch, getState, extra },
    ) => {
        const exchangeInfo = selectTradingExchangeInfo(getState());
        const quotesRequest = selectTradingExchangeQuotesRequest(getState());

        const provider =
            exchangeInfo?.providerInfos && quote.exchange
                ? exchangeInfo.providerInfos[quote.exchange]
                : null;

        if (!quotesRequest || !provider) {
            return;
        }

        const { symbol: sendCryptoNetworkSymbol, contractAddress: sendCryptoContractAddress } =
            cryptoIdToNetworkSymbolAndContractAddress(quotesRequest.send);
        const {
            symbol: receiveCryptoNetworkSymbol,
            contractAddress: receiveCryptoContractAddress,
        } = cryptoIdToNetworkSymbolAndContractAddress(quotesRequest.receive);

        asTypedDesktopAnalytics(extra.services.analytics).report({
            type: events.tradeExchangeEvent.name,
            payload: {
                action: 'continue',
                step: 'exchange-form',
                sendCryptoLabel: selectTradingCoinSymbolByCryptoId(getState(), quotesRequest.send),
                sendCryptoNetworkSymbol,
                sendCryptoContractAddress,
                receiveCryptoLabel: selectTradingCoinSymbolByCryptoId(
                    getState(),
                    quotesRequest.receive,
                ),
                receiveCryptoNetworkSymbol,
                receiveCryptoContractAddress,
                exchangeType,
                exchangeName: provider.companyName,
                rateType,
                fractionButton: fractionButton
                    ? `${(100 / fractionButton).toString()}%`
                    : undefined,
            },
        });

        await dispatch(
            exchangeThunks.selectQuoteThunk({
                quote,
                nextStep: () => {
                    dispatch(goto({ routeName: 'wallet-trading-exchange-confirm' }));
                },
            }),
        );
    },
);
