import { cloneDeep } from 'lodash';

import buyList from './buy/list.json';
import buyQuotesBTC from './buy/quotes-bitcoin.json';
import buyQuotesEthereum from './buy/quotes-ethereum.json';
import buyQuotesSolanaToken from './buy/quotes-solana-token.json';
import buyTradeBTCPayload from './buy/requests/trade-request-bitcoin.json';
import buyTradeSolanaPayload from './buy/requests/trade-request-solana.json';
import buyWatchPayload from './buy/requests/watch-request.json';
import buyTradeBTC from './buy/trade-bitcoin.json';
import buyTradeEthereum from './buy/trade-ethereum.json';
import buyTradeSolanaToken from './buy/trade-solana-token.json';
import buyWatch from './buy/watch.json';
import exchangeCoins from './exchange/coins.json';
import exchangeList from './exchange/list.json';
import exchangeQuotes from './exchange/quotes.json';
import exchangeTrade from './exchange/trade.json';
import exchangeWatch from './exchange/watch.json';
import info from './info.json';
import sellList from './sell/list.json';
import sellQuotesBTC from './sell/quotes-bitcoin.json';
import sellQuotesEthereumToken from './sell/quotes-ethereum-token.json';
import sellQuotesSolana from './sell/quotes-solana.json';
import sellQuotesPayload from './sell/requests/quotes-request.json';
import sellTradePayload from './sell/requests/trade-request.json';
import sellWatchPayload from './sell/requests/watch-request.json';
import sellTradeBTC from './sell/trade-bitcoin.json';
import sellTradeEthereumToken from './sell/trade-ethereum-token.json';
import sellTradeSolana from './sell/trade-solana.json';
import sellWatch from './sell/watch.json';
//Payloads
//Types
import { SellTradeResponse, TradeResponse } from './types';

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
    sellQuotes: `${invityUrl}/api/v3/sell/fiat/quotes`,
    sellTrade: `${invityUrl}/api/v3/sell/fiat/trade`,
    sellWatch: `${invityUrl}/api/v3/sell/fiat/watch/*`,
};

export const invityRequest = {
    buyTradeBTCPayload,
    buyTradeSolanaPayload,
    buyWatchPayload,
    sellQuotesPayload,
    sellTradePayload,
    sellWatchPayload,
};

export const invityResponses = {
    [invityEndpoint.exchangeCoins]: exchangeCoins,
    [invityEndpoint.exchangeList]: exchangeList,
    [invityEndpoint.exchangeQuotes]: exchangeQuotes,
    [invityEndpoint.exchangeTrade]: exchangeTrade,
    [invityEndpoint.exchangeWatch]: exchangeWatch,
    [invityEndpoint.info]: info,
    [invityEndpoint.buyList]: buyList,
    [invityEndpoint.buyWatch]: buyWatch,
    [invityEndpoint.sellList]: sellList,
    [invityEndpoint.sellWatch]: sellWatch,
};

// This modification allows us to skip the provider's part of the flow and continue further.
export const createRedirectedTradeResponse = (
    tradeResponse: TradeResponse | SellTradeResponse,
    tradeRequest: any,
) => {
    const modifiedResponse = cloneDeep(tradeResponse);
    modifiedResponse.trade.partnerData = tradeRequest.returnUrl;
    modifiedResponse.tradeForm.form.formAction = tradeRequest.returnUrl;
    modifiedResponse.trade.paymentId = tradeRequest.trade.paymentId;
    modifiedResponse.trade.orderId = tradeRequest.trade.orderId;
    if ('refundAddress' in modifiedResponse.trade && tradeRequest.refundAddress) {
        modifiedResponse.trade.refundAddress = tradeRequest.refundAddress;
    }

    return modifiedResponse;
};

export const getCompanyNameFromList = (name: string, type: 'buyList' | 'sellList') => {
    const list = type === 'buyList' ? buyList : sellList;
    const filteredItems = list.providers.filter(item => item.name === name);

    if (filteredItems.length !== 1) {
        throw new Error(
            `Expected exactly one item, but found ${filteredItems.length}\n${JSON.stringify(filteredItems, null, 2)}`,
        );
    }

    return filteredItems[0].companyName;
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
    buyQuotesSolanaToken,
    buyTradeBTC,
    buyTradeEthereum,
    buyTradeSolanaToken,
    buyWatch,
    sellList,
    sellQuotesBTC,
    sellQuotesEthereumToken,
    sellQuotesSolana,
    sellTradeBTC,
    sellTradeEthereumToken,
    sellTradeSolana,
    sellWatch,
};
