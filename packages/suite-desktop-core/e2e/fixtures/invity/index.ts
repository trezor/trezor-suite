import { cloneDeep } from 'lodash';

import buyList from './buy/list.json';
import buyQuotes from './buy/quotes.json';
import buyTrade from './buy/trade.json';
import buyWatch from './buy/watch.json';
import exchangeCoins from './exchange/coins.json';
import exchangeList from './exchange/list.json';
import exchangeQuotes from './exchange/quotes.json';
import exchangeTrade from './exchange/trade.json';
import exchangeWatch from './exchange/watch.json';
import info from './info.json';
import sellList from './sell/list.json';

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
    [invityEndpoint.buyQuotes]: buyQuotes,
    [invityEndpoint.buyWatch]: buyWatch,
    [invityEndpoint.sellList]: sellList,
};

// This modification allows us to skip the provider's part of the flow and go directly to the transaction detail.
export const createRedirectedTradeResponse = (url: string) => {
    const redirectToDetail = `${url}coinmarket-redirect#detail/btc/normal/0/${buyTrade.trade.paymentId}`;
    const modifiedTrade = cloneDeep(buyTrade);
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
    buyQuotes,
    buyTrade,
    buyWatch,
    sellList,
};
