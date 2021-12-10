import { createHash } from 'crypto';
import {
    ExchangeListResponse,
    ExchangeTradeQuoteResponse,
    ExchangeTradeQuoteRequest,
    ConfirmExchangeTradeRequest,
    ExchangeTrade,
    WatchExchangeTradeResponse,
    ExchangeCoinInfo,
    BuyListResponse,
    BuyTradeQuoteRequest,
    BuyTradeQuoteResponse,
    BuyTradeRequest,
    BuyTradeResponse,
    BuyTradeFormResponse,
    BuyTrade,
    WatchBuyTradeResponse,
    CountryInfo,
    SellListResponse,
    SellVoucherTradeQuoteRequest,
    SellVoucherTradeQuoteResponse,
    SellVoucherTradeRequest,
    SellVoucherTrade,
    SellFiatTradeQuoteRequest,
    SellFiatTrade,
    SellFiatTradeQuoteResponse,
    SellFiatTradeRequest,
    SellFiatTradeResponse,
    WatchSellTradeResponse,
} from 'invity-api';
import { isDesktop } from '@suite-utils/env';
import type {
    AccountInfoResponse,
    InvityServerEnvironment,
    InvityServers,
} from '@wallet-types/invity';
import { resolveStaticPath } from '@suite-utils/build';

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

class InvityAPI {
    unknownCountry = 'unknown';
    productionAPIServer = 'https://exchange.trezor.io';
    stagingAPIServer = 'https://staging-exchange1.invity.io';
    localhostAPIServer = 'http://localhost:3330';

    authenticationServersForSuiteDesktop = {
        production: 'https://suite-desktop-auth.invity.io', // TODO: update the desktop URL accordingly, current value is just suggestion
        staging: 'https://suite-desktop-staging-auth.invity.io', // TODO: update the desktop URL accordingly, current value is just suggestion
        localhost: 'http://localhost:4633',
    } as const;

    servers = {
        production: {
            api: 'https://exchange.trezor.io',
            authentication: isDesktop()
                ? this.authenticationServersForSuiteDesktop.production
                : 'https://auth.trezor.io',
        },
        staging1: {
            api: 'https://staging-exchange1.sldev.cz',
            authentication: isDesktop()
                ? this.authenticationServersForSuiteDesktop.staging
                : 'https://staging-auth.sldev.cz/suite',
        },
        staging2: {
            api: 'https://staging-exchange2.sldev.cz',
            authentication: isDesktop()
                ? this.authenticationServersForSuiteDesktop.staging
                : 'https://staging-auth.sldev.cz/suite',
        },
        localhost: {
            api: 'http://localhost:3330',
            authentication: isDesktop()
                ? this.authenticationServersForSuiteDesktop.localhost
                : 'http://localhost:4533',
        },
    } as InvityServers;

    private protectedAPI = false;
    private serverEnvironment = 'production' as InvityServerEnvironment;

    // info service
    private DETECT_COUNTRY_INFO = '/info/country';
    private GET_COUNTRY_INFO = '/info/country/{{country}}';

    // exchange service
    private EXCHANGE_LIST = '/exchange/list';
    private EXCHANGE_COINS = '/exchange/coins';
    private EXCHANGE_QUOTES = '/exchange/quotes';
    private EXCHANGE_DO_TRADE = '/exchange/trade';
    private EXCHANGE_WATCH_TRADE = '/exchange/watch/{{counter}}';

    // buy service
    private BUY_LIST = '/buy/list';
    private BUY_QUOTES = '/buy/quotes';
    private BUY_DO_TRADE = '/buy/trade';
    private BUY_GET_TRADE_FORM = '/buy/tradeform';
    private BUY_WATCH_TRADE = '/buy/watch/{{counter}}';

    // sell service
    private SELL_LIST = '/sell/list';
    private VOUCHER_QUOTES = '/sell/voucher/quotes';
    private VOUCHER_REQUEST_TRADE = '/sell/voucher/trade';
    private VOUCHER_CONFIRM_TRADE = '/sell/voucher/confirm';
    private SELL_FIAT_QUOTES = '/sell/fiat/quotes';
    private SELL_FIAT_DO_TRADE = '/sell/fiat/trade';
    private SELL_FIAT_CONFIRM = '/sell/fiat/confirm';
    private SELL_FIAT_WATCH_TRADE = '/sell/fiat/watch/{{counter}}';

    private ACCOUNT_INFO = '/account/info';

    private static accountDescriptor: string;
    private static apiKey: string;

    private getInvityAPIKey() {
        if (!InvityAPI.apiKey) {
            throw Error('apiKey not created');
        }

        return InvityAPI.apiKey;
    }

    getAllApiServerUrls() {
        return [
            this.servers.production.api,
            this.servers.staging1.api,
            this.servers.staging2.api,
            this.servers.localhost.api,
        ];
    }

    getAllDesktopAuthenticationServerUrls() {
        return [
            this.authenticationServersForSuiteDesktop.production,
            this.authenticationServersForSuiteDesktop.staging,
            this.authenticationServersForSuiteDesktop.localhost,
        ];
    }

    getApiServerUrl() {
        return this.servers[this.serverEnvironment].api;
    }

    getAuthServerUrl() {
        return this.servers[this.serverEnvironment].authentication;
    }

    getCurrentAccountDescriptor() {
        return InvityAPI.accountDescriptor;
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

    setProtectedAPI(protectedAPI: boolean) {
        this.protectedAPI = protectedAPI;
    }

    private options(body: BodyType = {}, method = 'POST', options: RequestInit = {}): any {
        const apiHeader = isDesktop() ? 'X-SuiteA-Api' : 'X-SuiteW-Api';
        if (this.protectedAPI) {
            options = {
                ...options,
                credentials: 'include',
            } as RequestInit;
        }
        if (method === 'POST') {
            return {
                ...options,
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
            ...options,
            method,
            mode: 'cors',
            headers: {
                [apiHeader]: this.getInvityAPIKey(),
            },
        };
    }

    private requestApiServer(
        url: string,
        body: BodyType = {},
        method = 'POST',
        options: RequestInit = {},
    ): Promise<any> {
        let prefix: string;
        if (!this.protectedAPI || this.getApiServerUrl() === this.servers.localhost.api) {
            prefix = '/api';
        } else {
            prefix = '/auth/api';
        }
        const finalUrl = `${this.getApiServerUrl()}${prefix}${url}`;
        const opts = this.options(body, method, options);
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

    fetchCountryInfo = async (country: string): Promise<CountryInfo> => {
        try {
            const url =
                country && country !== this.unknownCountry
                    ? this.GET_COUNTRY_INFO.replace('{{country}}', country)
                    : this.DETECT_COUNTRY_INFO;
            const response: CountryInfo = await this.requestApiServer(url, {}, 'GET');
            return response;
        } catch (error) {
            console.log('[fetchCountryInfo]', error);
        }
        return { country: this.unknownCountry };
    };

    getExchangeList = async (): Promise<ExchangeListResponse | []> => {
        try {
            const response = await this.requestApiServer(this.EXCHANGE_LIST, {}, 'GET');
            if (!response || response.length === 0) {
                return [];
            }
            return response;
        } catch (error) {
            console.log('[getExchangeList]', error);
        }
        return [];
    };

    getExchangeCoins = async (): Promise<ExchangeCoinInfo[]> => {
        try {
            const response = await this.requestApiServer(this.EXCHANGE_COINS, {}, 'GET');
            if (!response || response.length === 0) {
                return [];
            }
            return response;
        } catch (error) {
            console.log('[getExchangeCoins]', error);
        }
        return [];
    };

    getExchangeQuotes = async (
        params: ExchangeTradeQuoteRequest,
    ): Promise<ExchangeTrade[] | undefined> => {
        try {
            const response: ExchangeTradeQuoteResponse = await this.requestApiServer(
                this.EXCHANGE_QUOTES,
                params,
                'POST',
            );
            return response;
        } catch (error) {
            console.log('[getExchangeQuotes]', error);
        }
    };

    doExchangeTrade = async (tradeRequest: ConfirmExchangeTradeRequest): Promise<ExchangeTrade> => {
        try {
            const response: ExchangeTrade = await this.requestApiServer(
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
            const response: WatchExchangeTradeResponse = await this.requestApiServer(
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
            const response = await this.requestApiServer(this.BUY_LIST, {}, 'GET');
            return response;
        } catch (error) {
            console.log('[getBuyList]', error);
        }
    };

    getBuyQuotes = async (params: BuyTradeQuoteRequest): Promise<BuyTrade[] | undefined> => {
        try {
            const response: BuyTradeQuoteResponse = await this.requestApiServer(
                this.BUY_QUOTES,
                params,
                'POST',
            );
            return response;
        } catch (error) {
            console.log('[getBuyQuotes]', error);
        }
    };

    doBuyTrade = async (tradeRequest: BuyTradeRequest): Promise<BuyTradeResponse> => {
        try {
            const response: BuyTradeResponse = await this.requestApiServer(
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
            const response: BuyTradeFormResponse = await this.requestApiServer(
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
            const response: WatchBuyTradeResponse = await this.requestApiServer(
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

    getSellList = async (): Promise<SellListResponse | undefined> => {
        try {
            const response = await this.requestApiServer(this.SELL_LIST, {}, 'GET');
            return response;
        } catch (error) {
            console.log('[getSellList]', error);
        }
    };

    getVoucherQuotes = async (
        params: SellVoucherTradeQuoteRequest,
    ): Promise<SellVoucherTradeQuoteResponse | undefined> => {
        try {
            const response: SellVoucherTradeQuoteResponse = await this.requestApiServer(
                this.VOUCHER_QUOTES,
                params,
                'POST',
            );
            return response;
        } catch (error) {
            console.log('[getVoucherQuotes]', error);
        }
    };

    requestVoucherTrade = async (
        tradeRequest: SellVoucherTradeRequest,
    ): Promise<SellVoucherTrade> => {
        try {
            const response: SellVoucherTrade = await this.requestApiServer(
                this.VOUCHER_REQUEST_TRADE,
                tradeRequest,
                'POST',
            );
            return response;
        } catch (error) {
            console.log('[doVoucherTrade]', error);
            return { error: error.toString(), exchange: tradeRequest.exchange };
        }
    };

    confirmVoucherTrade = async (trade: SellVoucherTrade): Promise<SellVoucherTrade> => {
        try {
            const response: SellVoucherTrade = await this.requestApiServer(
                this.VOUCHER_CONFIRM_TRADE,
                trade,
                'POST',
            );
            return response;
        } catch (error) {
            console.log('[confirmVoucherTrade]', error);
            return { error: error.toString(), exchange: trade.exchange };
        }
    };

    getSellQuotes = async (
        params: SellFiatTradeQuoteRequest,
    ): Promise<SellFiatTrade[] | undefined> => {
        try {
            const response: SellFiatTradeQuoteResponse = await this.requestApiServer(
                this.SELL_FIAT_QUOTES,
                params,
                'POST',
            );
            return response;
        } catch (error) {
            console.log('[getSellQuotes]', error);
        }
    };

    doSellTrade = async (tradeRequest: SellFiatTradeRequest): Promise<SellFiatTradeResponse> => {
        try {
            const response: SellFiatTradeResponse = await this.requestApiServer(
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
            const response: SellFiatTrade = await this.requestApiServer(
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

    watchSellTrade = async (
        trade: SellFiatTrade,
        counter: number,
    ): Promise<WatchSellTradeResponse> => {
        try {
            const response: WatchSellTradeResponse = await this.requestApiServer(
                this.SELL_FIAT_WATCH_TRADE.replace('{{counter}}', counter.toString()),
                trade,
                'POST',
            );
            return response;
        } catch (error) {
            console.log('[watchSellFiatTrade]', error);
            return { error: error.toString() };
        }
    };

    getCheckWhoAmIUrl() {
        return `${this.getAuthServerUrl()}/sessions/whoami`;
    }

    private getInvityAuthenticationPageSrc(flow: 'login' | 'registration') {
        // TODO: where to put the http://localhost:21335?
        const url = new URL(
            isDesktop()
                ? `http://localhost:21335/invity-${flow}`
                : `${window.location.origin}${resolveStaticPath(
                      `invity-authentication/${flow}.html`,
                  )}`,
        );
        const returnToUrl = isDesktop()
            ? `http://localhost:21335/invity-${flow}-success`
            : `${window.location.origin}${resolveStaticPath(
                  `invity-authentication/${flow}-success.html`,
              )}`;
        url.searchParams.append('return_to', returnToUrl);
        url.hash = this.getAuthServerUrl();
        return url.toString();
    }

    getLoginPageSrc() {
        return this.getInvityAuthenticationPageSrc('login');
    }

    getRegistrationPageSrc() {
        return this.getInvityAuthenticationPageSrc('registration');
    }

    accountInfo = async (): Promise<AccountInfoResponse> => {
        try {
            const response: AccountInfoResponse = await this.requestApiServer(
                this.ACCOUNT_INFO,
                {},
                'GET',
            );
            return response;
        } catch (error) {
            console.log('[accountInfo]', error);
            return { error: error.toString() };
        }
    };
}

const invityAPI = new InvityAPI();

export default invityAPI;
