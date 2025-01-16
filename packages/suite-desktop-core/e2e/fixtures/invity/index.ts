import exchangeCoins from './exchange/coins.json';
import exchangeList from './exchange/list.json';
import exchangeQuotes from './exchange/quotes.json';
import exchangeTrade from './exchange/trade.json';
import exchangeWatch from './exchange/watch.json';
import info from './info.json';
import buyList from './buy/list.json';
import buyQuotes from './buy/quotes.json';
import buyTrade from './buy/trade.json';
import buyWatch from './buy/watch.json';
import sellList from './sell/list.json';

export const invityResponses = {
    'api/exchange/coins': exchangeCoins,
    'api/v3/exchange/list': exchangeList,
    'api/exchange/quotes': exchangeQuotes,
    'api/exchange/trade': exchangeTrade,
    'api/exchange/watch/0': exchangeWatch,
    'api/info': info,
    'api/v3/buy/list': buyList,
    'api/v3/buy/quotes': buyQuotes,
    'api/v3/buy/trade': buyTrade,
    'api/v3/buy/watch/0': buyWatch,
    'api/v3/sell/list': sellList,
};
