import buyInfo from './buy/info.json';
import buyList from './buy/list.json';
import buyQuotes from './buy/quotes.json';
import buyTrade from './buy/trade.json';
import buyWatch from './buy/watch.json';
import exchangeCoins from './exchange/coins.json';
import exchangeList from './exchange/list.json';
import exchangeQuotes from './exchange/quotes.json';
import exchangeTrade from './exchange/trade.json';
import exchangeWatch from './exchange/watch.json';

export const invityFixtures = {
    '/api/exchange/coins': exchangeCoins,
    '/api/exchange/list': exchangeList,
    '/api/exchange/quotes': exchangeQuotes,
    '/api/exchange/trade': exchangeTrade,
    '/api/exchange/watch/0': exchangeWatch,
    '/api/info': buyInfo,
    '/api/v3/buy/list': buyList,
    '/api/v3/buy/quotes': buyQuotes,
    '/api/v3/buy/trade': buyTrade,
    '/api/v3/buy/watch/0': buyWatch,
};
