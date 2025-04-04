import buyList from './buy/list.json';
import buyQuotesBTCUpdate from './buy/quotes-bitcoin-update.json';
import buyQuotesBTC from './buy/quotes-bitcoin.json';
import buyQuotesNegativeMax from './buy/quotes-buy-above-max.json';
import buyQuotesNegativeMin from './buy/quotes-buy-below-min.json';
import buyQuotesEthereum from './buy/quotes-ethereum.json';
import buyQuotesSolanaToken from './buy/quotes-solana-token.json';
import buyTradeBTCPayload from './buy/requests/trade-request-bitcoin.json';
import buyTradeSolanaPayload from './buy/requests/trade-request-solana.json';
import buyWatchPayload from './buy/requests/watch-request.json';
import buyTradeBTC from './buy/trade-bitcoin.json';
import buyTradeEthereum from './buy/trade-ethereum.json';
import buyTradeSolanaToken from './buy/trade-solana-token.json';
import buyWatch from './buy/watch.json';
import info from './info.json';
import sellList from './sell/list.json';
import sellQuotesBTC from './sell/quotes-bitcoin.json';
import sellQuotesEthereumToken from './sell/quotes-ethereum-token.json';
import sellQuotesSolana from './sell/quotes-solana.json';
import sellTradePayload from './sell/requests/trade-request.json';
import sellWatchPayload from './sell/requests/watch-request.json';
import sellTradeBTC from './sell/trade-bitcoin.json';
import sellTradeEthereumToken from './sell/trade-ethereum-token.json';
import sellTradeSolana from './sell/trade-solana.json';
import sellWatchBTC from './sell/watch-bitcoin.json';
import sellWatchEthereum from './sell/watch-ethereum.json';
import sellWatchSolana from './sell/watch-solana.json';
import swapList from './swap/list.json';
import swapQuotesSolanaBTC from './swap/quotes-solana-btc.json';
import swapQuotesSolanaTokens from './swap/quotes-solana-tokens.json';
import swapQuotesSolanaUSDC from './swap/quotes-solana-usdc.json';
import swapQuotesTetherBTC from './swap/quotes-tether-btc.json';
import swapTradeSolanaBTC from './swap/trade-solana-btc.json';
import swapTradeSolanaTokens from './swap/trade-solana-tokens.json';
import swapTradeSolanaUSDC from './swap/trade-solana-usdc.json';
import swapTradeTetherBTC from './swap/trade-tether-btc.json';
import swapWatch from './swap/watch.json';

const invityUrl = 'https://exchange.trezor.io';

export const invityEndpoint = {
    swapCoins: `${invityUrl}/api/v3/exchange/coins`,
    swapList: `${invityUrl}/api/v3/exchange/list`,
    swapQuotes: `${invityUrl}/api/v3/exchange/quotes`,
    swapTrade: `${invityUrl}/api/v3/exchange/trade`,
    swapWatch: `${invityUrl}/api/v3/exchange/watch/*`,
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
    sellTradePayload,
    sellWatchPayload,
};

export const invityGeneralResponses = {
    [invityEndpoint.swapList]: swapList,
    [invityEndpoint.swapWatch]: swapWatch,
    [invityEndpoint.info]: info,
    [invityEndpoint.buyList]: buyList,
    [invityEndpoint.buyWatch]: buyWatch,
    [invityEndpoint.sellList]: sellList,
};

export const getCompanyNameFromList = (name: string, type: 'buyList' | 'sellList' | 'swapList') => {
    const listMap = {
        buyList: buyList.providers,
        sellList: sellList.providers,
        swapList,
    };
    const providersArray = listMap[type];
    const filteredProviders = providersArray.filter(item => item.name === name);

    if (filteredProviders.length !== 1) {
        throw new Error(
            `Expected exactly one item, but found ${filteredProviders.length}\n${JSON.stringify(filteredProviders, null, 2)}`,
        );
    }

    return filteredProviders[0].companyName;
};

export {
    info,
    buyList,
    buyQuotesBTC,
    buyQuotesBTCUpdate,
    buyQuotesEthereum,
    buyQuotesNegativeMax,
    buyQuotesNegativeMin,
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
    sellWatchBTC,
    sellWatchEthereum,
    sellWatchSolana,
    swapList,
    swapQuotesSolanaBTC,
    swapQuotesSolanaTokens,
    swapQuotesSolanaUSDC,
    swapQuotesTetherBTC,
    swapTradeSolanaBTC,
    swapTradeSolanaTokens,
    swapTradeSolanaUSDC,
    swapTradeTetherBTC,
    swapWatch,
};
