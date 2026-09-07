import buyQuotesNegativeMax from './buy/quotes-buy-above-max.json';
import buyQuotesNegativeMin from './buy/quotes-buy-below-min.json';

const tradeApiUrl = 'https://exchange.trezor.io';

export const tradeEndpoint = {
    swapList: `${tradeApiUrl}/api/v3/exchange/list`,
    swapQuotes: `${tradeApiUrl}/api/v3/exchange/quotes`,
    swapTrade: `${tradeApiUrl}/api/v3/exchange/trade`,
    swapWatch: `${tradeApiUrl}/api/v3/exchange/watch/*`,
    buyList: `${tradeApiUrl}/api/v3/buy/list`,
    buyQuotes: `${tradeApiUrl}/api/v3/buy/quotes`,
    buyTrade: `${tradeApiUrl}/api/v3/buy/trade`,
    buyWatch: `${tradeApiUrl}/api/v3/buy/watch/*`,
    sellList: `${tradeApiUrl}/api/v3/sell/list`,
    sellTrade: `${tradeApiUrl}/api/v3/sell/fiat/trade`,
    sellConfirm: `${tradeApiUrl}/api/v3/sell/fiat/confirm`,
    sellWatch: `${tradeApiUrl}/api/v3/sell/fiat/watch/*`,
} as const;

export { buyQuotesNegativeMax, buyQuotesNegativeMin };
