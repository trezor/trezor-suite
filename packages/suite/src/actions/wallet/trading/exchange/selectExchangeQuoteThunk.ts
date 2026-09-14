import { type ExchangeTrade } from 'invity-api';

import { type DesktopAnalyticsDep, events } from '@suite/analytics';
import { type GotoThunkDeps, type GotoThunkState, gotoThunk } from '@suite/router';
import { type NetworksRootState, selectNetworkConfigAccessors } from '@suite-common/networks';
import { type WithServices, createThunk } from '@suite-common/redux-utils';
import {
    type TradingRootState,
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

type SelectExchangeQuoteThunkState = GotoThunkState & TradingRootState & NetworksRootState;

type SelectExchangeQuoteThunkDeps = GotoThunkDeps & WithServices<DesktopAnalyticsDep>;

export const selectExchangeQuoteThunk = createThunk<
    void,
    SelectExchangeQuoteThunkProps,
    {
        state: SelectExchangeQuoteThunkState;
        extra: SelectExchangeQuoteThunkDeps;
    }
>(
    'trading/exchange/selectQuoteWithAnalytics',
    async ({ quote, exchangeType, rateType, fractionButton }, { dispatch, getState, extra }) => {
        const networkConfigDeps = selectNetworkConfigAccessors(getState());

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
            cryptoIdToNetworkSymbolAndContractAddress(networkConfigDeps, quotesRequest.send);
        const {
            symbol: receiveCryptoNetworkSymbol,
            contractAddress: receiveCryptoContractAddress,
        } = cryptoIdToNetworkSymbolAndContractAddress(networkConfigDeps, quotesRequest.receive);

        extra.services.analytics.report({
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
                    dispatch(gotoThunk({ routeName: 'wallet-trading-exchange-confirm' }));
                },
            }),
        );
    },
);
