import { createHash } from 'crypto';
import {
    ExchangeListResponse,
    ExchangeTradeQuoteResponse,
    ExchangeTradeQuoteRequest,
    ConfirmExchangeTradeRequest,
    ExchangeTrade,
    BuyListResponse,
    BuyTradeQuoteRequest,
    BuyTradeQuoteResponse,
    BuyTradeRequest,
    BuyTradeResponse,
    BuyTradeFormResponse,
    BuyTrade,
    CountryInfo,
    SellListResponse,
    SellVoucherTradeQuoteRequest,
    SellVoucherTradeRequest,
    SellFiatTradeQuoteRequest,
    SellFiatTrade,
    SellFiatTradeQuoteResponse,
    SellFiatTradeRequest,
    SellFiatTradeResponse,
    InfoResponse,
} from 'invity-api';
import { getSuiteVersion, isDesktop } from '@trezor/env-utils';
import type { InvityServerEnvironment, InvityServers } from '@suite-common/invity';
import {
    CoinmarketPaymentMethodType,
    CoinmarketTradeDetailType,
    CoinmarketTradeType,
    CoinmarketWatchTradeResponseMapProps,
} from 'src/types/coinmarket/coinmarket';

type BodyType =
    | BuyTrade
    | ExchangeTradeQuoteRequest
    | ConfirmExchangeTradeRequest
    | ExchangeTrade
    | BuyTradeQuoteRequest
    | BuyTradeRequest
    | SellVoucherTradeQuoteRequest
    | SellVoucherTradeRequest
    | SellFiatTradeRequest;

type SignalType = AbortSignal | null | undefined;

class InvityAPI {
    unknownCountry = 'unknown';

    servers = {
        production: 'https://exchange.trezor.io',
        staging: 'https://staging-exchange.invity.io',
        dev: 'https://dev-exchange.invity.io',
        localhost: 'http://localhost:3330',
    } as InvityServers;

    private serverEnvironment = 'production' as InvityServerEnvironment;

    // info service
    private INFO = '/api/info';
    private DETECT_COUNTRY_INFO = '/api/info/country';
    private GET_COUNTRY_INFO = '/api/info/country/{{country}}';

    // exchange service
    private EXCHANGE_LIST = '/api/v3/exchange/list';
    private EXCHANGE_QUOTES = '/api/v3/exchange/quotes';
    private EXCHANGE_DO_TRADE = '/api/v3/exchange/trade';
    private EXCHANGE_WATCH_TRADE = '/api/v3/exchange/watch/{{counter}}';

    // buy service
    private BUY_LIST = '/api/v3/buy/list';
    private BUY_QUOTES = '/api/v3/buy/quotes';
    private BUY_DO_TRADE = '/api/v3/buy/trade';
    private BUY_GET_TRADE_FORM = '/api/v3/buy/tradeform';
    private BUY_WATCH_TRADE = '/api/v3/buy/watch/{{counter}}';

    // sell service
    private SELL_LIST = '/api/v3/sell/list';
    private SELL_FIAT_QUOTES = '/api/v3/sell/fiat/quotes';
    private SELL_FIAT_DO_TRADE = '/api/v3/sell/fiat/trade';
    private SELL_FIAT_CONFIRM = '/api/v3/sell/fiat/confirm';
    private SELL_FIAT_WATCH_TRADE = '/api/v3/sell/fiat/watch/{{counter}}';

    private static accountDescriptor: string;
    private static apiKey: string;

    private getInvityAPIKey() {
        if (!InvityAPI.apiKey) {
            throw Error('apiKey not created');
        }

        return InvityAPI.apiKey;
    }

    getApiServerUrl() {
        return this.servers[this.serverEnvironment];
    }

    getCurrentAccountDescriptor() {
        return InvityAPI.accountDescriptor;
    }

    getCurrentApiKey() {
        return InvityAPI.apiKey;
    }

    createInvityAPIKey(accountDescriptor: string) {
        if (accountDescriptor !== InvityAPI.accountDescriptor) {
            const hash = createHash('sha256');
            hash.update(accountDescriptor);
            InvityAPI.apiKey = hash.digest('hex');
            InvityAPI.accountDescriptor = accountDescriptor;
        }
    }

    setInvityServersEnvironment(serverEnvironment: InvityServerEnvironment) {
        if (serverEnvironment) {
            this.serverEnvironment = serverEnvironment;
        }
    }

    private options(
        body: BodyType = {},
        method = 'POST',
        apiHeaderValue?: string,
        signal?: SignalType,
    ): any {
        const apiHeader = isDesktop() ? 'X-SuiteA-Api' : 'X-SuiteW-Api';

        return {
            method,
            mode: 'cors',
            headers: {
                [apiHeader]: apiHeaderValue || this.getInvityAPIKey(),
                'X-Suite-Version': getSuiteVersion(),
                ...(method === 'POST' && {
                    'Cache-Control': 'no-cache',
                    'Content-Type': 'application/json',
                }),
            },
            ...(method === 'POST' && {
                body: JSON.stringify(body),
            }),
            signal,
        };
    }

    private async request(
        url: string,
        body: BodyType = {},
        method = 'POST',
        apiHeaderValue?: string,
        signal?: SignalType,
    ): Promise<any> {
        const finalUrl = `${this.getApiServerUrl()}${url}`;
        const opts = this.options(body, method, apiHeaderValue, signal);

        return await fetch(finalUrl, opts).then(response => {
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

    getInfo = async (): Promise<InfoResponse> => {
        try {
            const response = await this.request(this.INFO, {}, 'GET');
            if (response) {
                return response;
            }
        } catch (error) {
            console.log('[getInfo]', error);
        }

        return { platforms: {}, coins: {} };
    };

    getExchangeList = async (): Promise<ExchangeListResponse | []> => {
        try {
            const response = await this.request(this.EXCHANGE_LIST, {}, 'GET');
            if (!response || response.length === 0) {
                return [];
            }

            return response;
        } catch (error) {
            console.log('[getExchangeList]', error);
        }

        return [];
    };

    getExchangeQuotes = async (
        params: ExchangeTradeQuoteRequest,
        signal?: SignalType,
    ): Promise<ExchangeTrade[] | undefined> => {
        try {
            const response: ExchangeTradeQuoteResponse = await this.request(
                this.EXCHANGE_QUOTES,
                params,
                'POST',
                undefined,
                signal,
            );

            return response;
        } catch (error) {
            console.log('[getExchangeQuotes]', error);
        }
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

    getBuyList = async (): Promise<BuyListResponse | undefined> => {
        try {
            const response = await this.request(this.BUY_LIST, {}, 'GET');

            return response;
        } catch (error) {
            console.log('[getBuyList]', error);
        }
    };

    getBuyQuotes = async (
        params: BuyTradeQuoteRequest,
        signal?: SignalType,
    ): Promise<BuyTradeQuoteResponse | undefined> => {
        try {
            const response: BuyTradeQuoteResponse = await this.request(
                this.BUY_QUOTES,
                params,
                'POST',
                undefined,
                signal,
            );

            return response;
        } catch (error) {
            console.log('[getBuyQuotes]', error);
        }
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

    getSellList = async (): Promise<SellListResponse | undefined> => {
        try {
            const response = await this.request(this.SELL_LIST, {}, 'GET');

            return response;
        } catch (error) {
            console.log('[getSellList]', error);
        }
    };

    getSellQuotes = async (
        params: SellFiatTradeQuoteRequest,
        signal?: SignalType,
    ): Promise<SellFiatTrade[] | undefined> => {
        try {
            const response: SellFiatTradeQuoteResponse = await this.request(
                this.SELL_FIAT_QUOTES,
                params,
                'POST',
                undefined,
                signal,
            );

            return response;
        } catch (error) {
            console.log('[getSellQuotes]', error);
        }
    };

    doSellTrade = async (tradeRequest: SellFiatTradeRequest): Promise<SellFiatTradeResponse> => {
        try {
            const response: SellFiatTradeResponse = await this.request(
                this.SELL_FIAT_DO_TRADE,
                tradeRequest,
                'POST',
            );

            return response;
        } catch (error) {
            console.log('[doSellTrade]', error);

            return { trade: { error: error.toString(), exchange: tradeRequest.trade.exchange } };
        }
    };

    doSellConfirm = async (trade: SellFiatTrade): Promise<SellFiatTrade> => {
        try {
            const response: SellFiatTrade = await this.request(
                this.SELL_FIAT_CONFIRM,
                trade,
                'POST',
            );

            return response;
        } catch (error) {
            console.log('[doSellConfirm]', error);

            return { error: error.toString(), exchange: trade.exchange };
        }
    };

    getCoinLogoUrl(coin: string): string {
        return `${this.getApiServerUrl()}/images/coins/suite/${coin}.svg`;
    }

    getProviderLogoUrl(logo: string): string {
        return `${this.getApiServerUrl()}/images/exchange/${logo}`;
    }

    getPaymentMethodUrl(paymentMethod: CoinmarketPaymentMethodType): string {
        return `${this.getApiServerUrl()}/images/paymentMethods/suite/${paymentMethod}.svg`;
    }

    private getWatchTradeData = (tradeType: CoinmarketTradeType) => {
        const tradesData = {
            exchange: {
                url: this.EXCHANGE_WATCH_TRADE,
                logPrefix: '[watchExchangeTrade]',
            },
            buy: {
                url: this.BUY_WATCH_TRADE,
                logPrefix: '[watchBuyTrade]',
            },

            sell: {
                url: this.SELL_FIAT_WATCH_TRADE,
                logPrefix: '[watchSellFiatTrade]',
            },
        };

        return tradesData[tradeType];
    };

    watchTrade = async <T extends CoinmarketTradeType>(
        tradeData: CoinmarketTradeDetailType,
        tradeType: CoinmarketTradeType,
        counter: number,
    ): Promise<CoinmarketWatchTradeResponseMapProps[T]> => {
        const tradesData = this.getWatchTradeData(tradeType);

        try {
            const response: CoinmarketWatchTradeResponseMapProps[T] = await this.request(
                tradesData.url.replace('{{counter}}', counter.toString()),
                tradeData,
                'POST',
            );

            return response;
        } catch (error) {
            console.log(tradesData.logPrefix, error);

            return { error: error.toString() };
        }
    };
}

const invityAPI = new InvityAPI();

export default invityAPI;
