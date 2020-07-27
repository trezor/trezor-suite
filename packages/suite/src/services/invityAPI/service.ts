import { v4 as uuidv4 } from 'uuid';
import {
    ExchangeListResponse,
    ExchangeCoinListResponse,
    ExchangeTradeQuoteResponse,
    ExchangeTradeQuoteRequest,
    ConfirmExchangeTradeRequest,
    ExchangeTrade,
    WatchExchangeTradeResponse,
    ExchangeCoinInfo,
} from './exchangeTypes';
import {
    BuyListResponse,
    BuyTradeQuoteRequest,
    BuyTradeQuoteResponse,
    BuyTradeRequest,
    BuyTradeResponse,
    BuyTradeFormResponse,
    BuyTrade,
    WatchBuyTradeResponse,
} from './buyTypes';
import { CountryInfo, SupportTicketResponse, SupportTicket } from './utilityTypes';
import { isDev } from '@suite/utils/suite/build';

// import {
//     localStorageGetString,
//     localStorageSetString,
//     localStorageGetCache,
//     localStorageSetCache,
// } from '@utils/localstorage';

// TODO - get from constants
const BitcoinTestnetTicker = 'TEST';
const EthereumTestnetRopstenTicker = 'tROP';

// TODO - just placeholders, will be handled differently
function localStorageGetString(_key: string): string | null {
    return null;
}

function localStorageSetString(_key: string, _value: string) {
    return null;
}

function localStorageGetCache<T>(_key: string, _timeoutSeconds: number = 10 * 60): T | undefined {
    return undefined;
}

export function localStorageSetCache<T>(_key: string, _value: T) {}

export interface StringMap {
    [key: string]: string;
}

class InvityAPI {
    unknownCountry = 'unknown';
    productionAPIServer = 'https://exchange.invity.io';
    stagingAPIServer = 'https://staging-exchange.invity.io';
    localhostAPIServer = 'http://localhost:3330';

    server: string = this.productionAPIServer;

    private InvityAPIKey = 'InvityAPI';
    private InvityAPIServerKey = 'InvityAPIServer';
    private ExchangeListCacheKey = 'ExchangeList';
    private ExchangeCoinsCacheKey = 'ExchangeCoins';
    private BuyListCacheKey = 'BuyList';

    // info service
    private DETECT_COUNTRY_INFO = '/api/info/country';
    private GET_COUNTRY_INFO = '/api/info/country/{{country}}';
    private CREATE_SUPPORT_TICKET = '/api/support/ticket';

    // exchange service
    private EXCHANGE_LIST = '/api/exchange/list';
    private EXCHANGE_COINS = '/api/exchange/coins';
    private EXCHANGE_QUOTES = '/api/exchange/quotes';
    private EXCHANGE_DO_TRADE = '/api/exchange/trade';
    private EXCHANGE_WATCH_TRADE = '/api/exchange/watch/{{counter}}';
    // buy service
    private BUY_LIST = '/api/buy/list';
    private BUY_QUOTES = '/api/buy/quotes';
    private BUY_DO_TRADE = '/api/buy/trade';
    private BUY_GET_TRADE_FORM = '/api/buy/tradeform';
    private BUY_WATCH_TRADE = '/api/buy/watch/{{counter}}';

    constructor() {
        let defaultServer;
        if (isDev()) {
            defaultServer = this.stagingAPIServer;
        } else {
            defaultServer = this.productionAPIServer;
        }
        this.server = localStorageGetString(this.InvityAPIServerKey) || defaultServer;
        // override for now the production api server
        if (!this.server) {
            this.server = defaultServer;
        }
    }

    private getInvityAPIKey() {
        // TODO - api key is from current account
        let key = localStorageGetString(this.InvityAPIKey);
        if (!key) {
            key = uuidv4();
            localStorageSetString(this.InvityAPIKey, key);
        }
        return key;
    }

    setInvityAPIServer(server: string) {
        this.server = server;
        localStorageSetString(this.InvityAPIServerKey, server);
    }

    private options(body = {}, method = 'POST'): any {
        // TODO different header for web 'X-SuiteW-Api' and electron suite 'X-SuiteA-Api'
        const apiHeader = 'X-Invity-Api';
        if (method === 'POST') {
            return {
                method,
                mode: 'cors',
                headers: {
                    'Cache-Control': 'no-cache',
                    'Content-Type': 'application/json',
                    [apiHeader]: this.getInvityAPIKey(),
                },
                body: JSON.stringify(body),
            };
        }
        return {
            method,
            mode: 'cors',
            headers: {
                [apiHeader]: this.getInvityAPIKey(),
            },
        };
    }

    private request(url: string, body: {}, method = 'POST'): Promise<any> {
        const finalUrl = `${this.server}${url}`;
        const opts = this.options(body, method);
        return fetch(finalUrl, opts).then(response => {
            if (response.ok) {
                return response.json();
            }
            return response.json().then(output => {
                if (output.error) {
                    return output;
                }
                throw Error(`Request rejected with status ${response.status}`);
            });
        });
    }

    createSupportTicket = async (ticket: SupportTicket): Promise<SupportTicketResponse> => {
        let response: SupportTicketResponse = { error: '', statusCode: 200 };
        try {
            const url = this.CREATE_SUPPORT_TICKET;
            response = await this.request(url, ticket, 'POST');
        } catch (error) {
            console.log('[createSupportTicket]', error);
            response.error = error;
        }
        return response;
    };

    fetchCountryInfo = async (country: string): Promise<CountryInfo> => {
        try {
            const url =
                country && country !== this.unknownCountry
                    ? this.GET_COUNTRY_INFO.replace('{{country}}', country)
                    : this.DETECT_COUNTRY_INFO;
            const response: CountryInfo = await this.request(url, {}, 'GET');
            return response;
        } catch (error) {
            console.log('[fetchCountryInfo]', error);
        }
        return { country: this.unknownCountry };
    };

    getExchangeList = async (): Promise<ExchangeListResponse | []> => {
        try {
            let response = localStorageGetCache<ExchangeListResponse>(this.ExchangeListCacheKey);
            if (!response) {
                response = await this.request(this.EXCHANGE_LIST, {}, 'GET');
                if (!response || response.length === 0) {
                    return [];
                }
                localStorageSetCache(this.ExchangeListCacheKey, response);
            }
            return response;
        } catch (error) {
            console.log('[getExchangeList]', error);
        }
        return [];
    };

    getExchangeCoins = async (): Promise<ExchangeCoinInfo[]> => {
        try {
            let response = localStorageGetCache<ExchangeCoinListResponse>(
                this.ExchangeCoinsCacheKey,
            );
            if (!response) {
                response = await this.request(this.EXCHANGE_COINS, {}, 'GET');
                if (!response || response.length === 0) {
                    return [];
                }
                // add BTC and ETH testnet in dev
                if (isDev()) {
                    response.push({
                        ticker: BitcoinTestnetTicker,
                        name: 'Bitcoin Testnet',
                        category: 'Testnet',
                    });
                    response.push({
                        ticker: EthereumTestnetRopstenTicker,
                        name: 'Ethereum Testnet Ropsten',
                        category: 'Testnet',
                    });
                }
                localStorageSetCache(this.ExchangeCoinsCacheKey, response);
            }
            return response;
        } catch (error) {
            console.log('[getExchangeCoins]', error);
        }
        return [];
    };

    getExchangeQuotes = async (params: ExchangeTradeQuoteRequest): Promise<ExchangeTrade[]> => {
        try {
            const response: ExchangeTradeQuoteResponse = await this.request(
                this.EXCHANGE_QUOTES,
                params,
                'POST',
            );
            return response;
        } catch (error) {
            console.log('[getExchangeQuotes]', error);
        }
        return [];
    };

    doExchangeTrade = async (tradeRequest: ConfirmExchangeTradeRequest): Promise<ExchangeTrade> => {
        try {
            const response: ExchangeTrade = await this.request(
                this.EXCHANGE_DO_TRADE,
                tradeRequest,
                'POST',
            );
            return response;
        } catch (error) {
            console.log('[doExchangeTrade]', error);
            return { error: error.toString(), exchange: tradeRequest.trade.exchange };
        }
    };

    watchExchangeTrade = async (
        trade: ExchangeTrade,
        counter: number,
    ): Promise<WatchExchangeTradeResponse> => {
        try {
            const response: WatchExchangeTradeResponse = await this.request(
                this.EXCHANGE_WATCH_TRADE.replace('{{counter}}', counter.toString()),
                trade,
                'POST',
            );
            return response;
        } catch (error) {
            console.log('[watchExchangeTrade]', error);
            return { error: error.toString() };
        }
    };

    getBuyList = async (): Promise<BuyListResponse | undefined> => {
        try {
            let response = localStorageGetCache<BuyListResponse>(this.BuyListCacheKey);
            if (!response) {
                response = await this.request(this.BUY_LIST, {}, 'GET');
                if (response && response.providers && response.providers.length > 0) {
                    localStorageSetCache(this.BuyListCacheKey, response);
                }
            }
            return response;
        } catch (error) {
            console.log('[getBuyList]', error);
        }
    };

    getBuyQuotes = async (params: BuyTradeQuoteRequest): Promise<BuyTrade[]> => {
        try {
            const response: BuyTradeQuoteResponse = await this.request(
                this.BUY_QUOTES,
                params,
                'POST',
            );
            return response;
        } catch (error) {
            console.log('[getBuyQuotes]', error);
        }
        return [];
    };

    doBuyTrade = async (tradeRequest: BuyTradeRequest): Promise<BuyTradeResponse> => {
        try {
            const response: BuyTradeResponse = await this.request(
                this.BUY_DO_TRADE,
                tradeRequest,
                'POST',
            );
            return response;
        } catch (error) {
            console.log('[doBuyTrade]', error);
            return { trade: { error: error.toString(), exchange: tradeRequest.trade.exchange } };
        }
    };

    getBuyTradeForm = async (tradeRequest: BuyTradeRequest): Promise<BuyTradeFormResponse> => {
        try {
            const response: BuyTradeFormResponse = await this.request(
                this.BUY_GET_TRADE_FORM,
                tradeRequest,
                'POST',
            );
            return response;
        } catch (error) {
            console.log('[getBuyTradeForm]', error);
            return { error: error.toString() };
        }
    };

    watchBuyTrade = async (trade: BuyTrade, counter: number): Promise<WatchBuyTradeResponse> => {
        try {
            const response: WatchBuyTradeResponse = await this.request(
                this.BUY_WATCH_TRADE.replace('{{counter}}', counter.toString()),
                trade,
                'POST',
            );
            return response;
        } catch (error) {
            console.log('[watchBuyTrade]', error);
            return { error: error.toString() };
        }
    };
}

const invityAPI = new InvityAPI();

export default invityAPI;
