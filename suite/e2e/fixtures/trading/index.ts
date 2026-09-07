import buyQuotesNegativeMax from './buy/quotes-buy-above-max.json';
import buyQuotesNegativeMin from './buy/quotes-buy-below-min.json';

const tradeApiUrl = 'https://exchange.trezor.io';

export const tradeEndpoint = {
    swapCoins: `${tradeApiUrl}/api/v3/exchange/coins`,
    swapList: `${tradeApiUrl}/api/v3/exchange/list`,
    swapQuotes: `${tradeApiUrl}/api/v3/exchange/quotes`,
    swapTrade: `${tradeApiUrl}/api/v3/exchange/trade`,
    swapWatch: `${tradeApiUrl}/api/v3/exchange/watch/*`,
    info: `${tradeApiUrl}/api/info`,
    buyList: `${tradeApiUrl}/api/v3/buy/list`,
    buyQuotes: `${tradeApiUrl}/api/v3/buy/quotes`,
    buyTrade: `${tradeApiUrl}/api/v3/buy/trade`,
    buyWatch: `${tradeApiUrl}/api/v3/buy/watch/*`,
    sellList: `${tradeApiUrl}/api/v3/sell/list`,
    sellQuotes: `${tradeApiUrl}/api/v3/sell/fiat/quotes`,
    sellTrade: `${tradeApiUrl}/api/v3/sell/fiat/trade`,
    sellConfirm: `${tradeApiUrl}/api/v3/sell/fiat/confirm`,
    sellWatch: `${tradeApiUrl}/api/v3/sell/fiat/watch/*`,
} as const;

export { buyQuotesNegativeMax, buyQuotesNegativeMin };
