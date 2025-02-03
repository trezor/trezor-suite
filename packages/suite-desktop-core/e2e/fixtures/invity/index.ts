import { cloneDeep } from 'lodash';

import { NetworkSymbol } from '@suite-common/wallet-config';

import buyList from './buy/list.json';
import buyQuotesBTC from './buy/quotes-bitcoin.json';
import buyQuotesEthereum from './buy/quotes-ethereum.json';
import buyQuotesSolana from './buy/quotes-solana.json';
import buyTradeBTC from './buy/trade-bitcoin.json';
import buyTradeEthereum from './buy/trade-ethereum.json';
import buyTradeSolana from './buy/trade-solana.json';
import buyWatch from './buy/watch.json';
import exchangeCoins from './exchange/coins.json';
import exchangeList from './exchange/list.json';
import exchangeQuotes from './exchange/quotes.json';
import exchangeTrade from './exchange/trade.json';
import exchangeWatch from './exchange/watch.json';
import info from './info.json';
import sellList from './sell/list.json';
import { TradeRequest } from './types';

const invityUrl = 'https://exchange.trezor.io';

export const invityEndpoint = {
    exchangeCoins: `${invityUrl}/api/exchange/coins`,
    exchangeList: `${invityUrl}/api/v3/exchange/list`,
    exchangeQuotes: `${invityUrl}/api/exchange/quotes`,
    exchangeTrade: `${invityUrl}/api/exchange/trade`,
    exchangeWatch: `${invityUrl}/api/exchange/watch/*`,
    info: `${invityUrl}/api/info`,
    buyList: `${invityUrl}/api/v3/buy/list`,
    buyQuotes: `${invityUrl}/api/v3/buy/quotes`,
    buyTrade: `${invityUrl}/api/v3/buy/trade`,
    buyWatch: `${invityUrl}/api/v3/buy/watch/*`,
    sellList: `${invityUrl}/api/v3/sell/list`,
};

export const invityResponses = {
    [invityEndpoint.exchangeCoins]: exchangeCoins,
    [invityEndpoint.exchangeList]: exchangeList,
    [invityEndpoint.exchangeQuotes]: exchangeQuotes,
    [invityEndpoint.exchangeTrade]: exchangeTrade,
    [invityEndpoint.exchangeWatch]: exchangeWatch,
    [invityEndpoint.info]: info,
    [invityEndpoint.buyList]: buyList,
    [invityEndpoint.buyQuotes]: buyQuotesBTC,
    [invityEndpoint.buyWatch]: buyWatch,
    [invityEndpoint.sellList]: sellList,
};

// This modification allows us to skip the provider's part of the flow and go directly to the transaction detail.
export const createRedirectedTradeResponse = (params: {
    symbol: NetworkSymbol;
    tradeRequest: TradeRequest;
    url: string;
}) => {
    const redirectToDetail = `${params.url}coinmarket-redirect#detail/${params.symbol}/normal/0/${params.tradeRequest.trade.paymentId}`;
    const modifiedTrade = cloneDeep(params.tradeRequest);
    modifiedTrade.trade.partnerData = redirectToDetail;
    modifiedTrade.tradeForm.form.formAction = redirectToDetail;

    return modifiedTrade;
};

export {
    exchangeCoins,
    exchangeList,
    exchangeQuotes,
    exchangeTrade,
    exchangeWatch,
    info,
    buyList,
    buyQuotesBTC,
    buyQuotesEthereum,
    buyQuotesSolana,
    buyTradeBTC,
    buyTradeEthereum,
    buyTradeSolana,
    buyWatch,
    sellList,
};
