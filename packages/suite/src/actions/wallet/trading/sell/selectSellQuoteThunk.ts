import { type SellFiatTrade } from 'invity-api';

import { type DesktopAnalyticsDep, events } from '@suite/analytics';
import { type GotoThunkDeps, type GotoThunkState, gotoThunk } from '@suite/router';
import {
    type TradingRootState,
    cryptoIdToNetworkSymbolAndContractAddress,
    selectTradingSellInfo,
    selectTradingSellQuotesRequest,
    selectTradingSymbolAndContractAddressByCryptoId,
    sellThunks,
    sellUtils,
    tradingSellActions,
} from '@suite-common/trading';
import { type WithServices, createThunk } from '@trezor/redux-utils';

type SelectSellQuoteThunkParams = { quote: SellFiatTrade; fractionButton?: number };

export type SelectSellQuoteThunkState = GotoThunkState & TradingRootState;

type SelectSellQuoteThunkDeps = GotoThunkDeps & WithServices<DesktopAnalyticsDep>;

export const selectSellQuoteThunk = createThunk<
    void,
    SelectSellQuoteThunkParams,
    { state: SelectSellQuoteThunkState; extra: SelectSellQuoteThunkDeps }
>(
    'trading/sell/selectQuoteWithAnalytics',
    async ({ quote, fractionButton }, { dispatch, getState, extra }) => {
        const sellInfo = selectTradingSellInfo(getState());
        const quotesRequest = selectTradingSellQuotesRequest(getState());

        const provider = sellInfo && quote.exchange ? sellInfo.providerInfos[quote.exchange] : null;

        if (!quotesRequest || !sellInfo || !provider) {
            return;
        }

        dispatch(tradingSellActions.setFormStep(sellUtils.getStepForQuote({ sellInfo, quote })));

        const { coinSymbol: cryptoLabel, contractAddress: cryptoContractAddress } =
            selectTradingSymbolAndContractAddressByCryptoId(
                getState(),
                quotesRequest.cryptoCurrency,
            );
        const { symbol: cryptoNetworkSymbol } = cryptoIdToNetworkSymbolAndContractAddress(
            quotesRequest.cryptoCurrency,
        );

        extra.services.analytics.report({
            type: events.tradeSellEvent.name,
            payload: {
                action: 'continue',
                step: 'sell-form',
                cryptoLabel,
                cryptoNetworkSymbol,
                cryptoContractAddress,
                exchangeName: quote.exchange,
                receiveMethod: quote.paymentMethod,
                countryOfResidence: quotesRequest.country,
                fractionButton: fractionButton
                    ? `${(100 / fractionButton).toString()}%`
                    : undefined,
            },
        });

        const nextStep = () => {
            dispatch(gotoThunk({ routeName: 'wallet-trading-sell-confirm' }));
        };

        await dispatch(sellThunks.selectQuoteThunk({ quote, nextStep }));
    },
);
