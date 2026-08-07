import { type SellFiatTrade } from 'invity-api';

import { type DesktopAnalyticsDep, asTypedDesktopAnalytics, events } from '@suite/analytics';
import { type GotoThunkDeps, type GotoThunkState, goto } from '@suite/router';
import { createThunk } from '@suite-common/redux-utils';
import {
    cryptoIdToNetworkSymbolAndContractAddress,
    selectTradingSellInfo,
    selectTradingSellQuotesRequest,
    selectTradingSymbolAndContractAddressByCryptoId,
    sellThunks,
    sellUtils,
} from '@suite-common/trading';

import { type RequestSellTradeThunkState, requestSellTradeThunk } from './requestSellTradeThunk';

type SelectSellQuoteThunkParams = { quote: SellFiatTrade; fractionButton?: number };
type SelectSellQuoteThunkState = GotoThunkState & RequestSellTradeThunkState;
type SelectSellQuoteThunkDeps = GotoThunkDeps & { services: DesktopAnalyticsDep };

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

        if (!quotesRequest || !provider) {
            return;
        }

        const { coinSymbol: cryptoLabel, contractAddress: cryptoContractAddress } =
            selectTradingSymbolAndContractAddressByCryptoId(
                getState(),
                quotesRequest.cryptoCurrency,
            );
        const { symbol: cryptoNetworkSymbol } = cryptoIdToNetworkSymbolAndContractAddress(
            quotesRequest.cryptoCurrency,
        );

        asTypedDesktopAnalytics(extra.services.analytics).report({
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
            dispatch(goto({ routeName: 'wallet-trading-sell-confirm' }));

            // Empty quoteId means the partner requests login first; keep the UI moving
            // to confirm while the partner request continues in the background.
            if (
                (sellInfo && sellUtils.needToRegisterOrVerifyBankAccount({ quote, sellInfo })) ||
                !quote.quoteId
            ) {
                void dispatch(requestSellTradeThunk({ quote }));
            }
        };

        await dispatch(sellThunks.selectQuoteThunk({ quote, nextStep }));
    },
);
