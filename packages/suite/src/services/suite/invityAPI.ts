import { createHash } from 'crypto';
import {
    ExchangeListResponse,
    ExchangeTradeQuoteResponse,
    ExchangeTradeQuoteRequest,
    ConfirmExchangeTradeRequest,
    ExchangeTrade,
    WatchExchangeTradeResponse,
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
    P2pListResponse,
    P2pQuotesRequest,
    P2pQuotesResponse,
    P2pTradeRequest,
    P2pTradeResponse,
    InitSavingsTradeRequest,
    SavingsListResponse,
    SavingsKYCStatus,
    SavingsTradeRequest,
    SavingsTradeResponse,
    SavingsTradeKYCStatusResponse,
    WatchSavingTradeItemResponse,
    FormResponse,
    CryptoSymbolsResponse,
} from 'invity-api';
import { isDesktop } from '@trezor/env-utils';
import type { InvityServerEnvironment, InvityServers } from '@suite-common/invity';

export const SavingsTradeKYCFinalStatuses: SavingsKYCStatus[] = ['Failed', 'Verified'];

type BodyType =
    | BuyTrade
    | ExchangeTradeQuoteRequest
    | ConfirmExchangeTradeRequest
    | ExchangeTrade
    | BuyTradeQuoteRequest
    | BuyTradeRequest
    | SellVoucherTradeQuoteRequest
    | SellVoucherTradeRequest
    | SellFiatTradeRequest
    | P2pTradeRequest
    | SavingsTradeRequest;

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
    private DETECT_COUNTRY_INFO = '/api/info/country';
    private GET_COUNTRY_INFO = '/api/info/country/{{country}}';
    private SYMBOLS_INFO = '/api/info/symbols';

    // exchange service
    private EXCHANGE_LIST = '/api/v2/exchange/list';
    private EXCHANGE_QUOTES = '/api/v2/exchange/quotes';
    private EXCHANGE_DO_TRADE = '/api/v2/exchange/trade';
    private EXCHANGE_WATCH_TRADE = '/api/v2/exchange/watch/{{counter}}';

    // buy service
    private BUY_LIST = '/api/v2/buy/list';
    private BUY_QUOTES = '/api/v2/buy/quotes';
    private BUY_DO_TRADE = '/api/v2/buy/trade';
    private BUY_GET_TRADE_FORM = '/api/v2/buy/tradeform';
    private BUY_WATCH_TRADE = '/api/v2/buy/watch/{{counter}}';

    // sell service
    private SELL_LIST = '/api/v2/sell/list';
    private VOUCHER_QUOTES = '/api/v2/sell/voucher/quotes';
    private VOUCHER_REQUEST_TRADE = '/api/v2/sell/voucher/trade';
    private VOUCHER_CONFIRM_TRADE = '/api/v2/sell/voucher/confirm';
    private SELL_FIAT_QUOTES = '/api/v2/sell/fiat/quotes';
    private SELL_FIAT_DO_TRADE = '/api/v2/sell/fiat/trade';
    private SELL_FIAT_CONFIRM = '/api/v2/sell/fiat/confirm';
    private SELL_FIAT_WATCH_TRADE = '/api/v2/sell/fiat/watch/{{counter}}';

    private P2P_LIST = '/api/p2p/list';
    private P2P_QUOTES = '/api/p2p/quotes';
    private P2P_TRADE = '/api/p2p/trade';

    private SAVINGS_LIST = '/api/savings/list';
    private SAVINGS_INIT = '/api/savings/trezor/init';
    private SAVINGS_TRADE = '/api/savings/trezor/trade';
    private SAVINGS_WATCH_ITEM = '/api/savings/watch-item';
    private SAVINGS_WATCH_KYC = '/api/savings/trezor/watch-kyc';

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

    private options(body: BodyType = {}, method = 'POST', apiHeaderValue?: string): any {
        const apiHeader = isDesktop() ? 'X-SuiteA-Api' : 'X-SuiteW-Api';
        if (method === 'POST') {
            return {
                method,
                mode: 'cors',
                headers: {
                    'Cache-Control': 'no-cache',
                    'Content-Type': 'application/json',
                    [apiHeader]: apiHeaderValue || this.getInvityAPIKey(),
                },
                body: JSON.stringify(body),
            };
        }
        return {
            method,
            mode: 'cors',
            headers: {
                [apiHeader]: apiHeaderValue || this.getInvityAPIKey(),
            },
        };
    }

    private request(
        url: string,
        body: BodyType = {},
        method = 'POST',
        apiHeaderValue?: string,
    ): Promise<any> {
        const finalUrl = `${this.getApiServerUrl()}${url}`;
        const opts = this.options(body, method, apiHeaderValue);
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
            const response: CountryInfo = await this.request(url, {}, 'GET');
            return response;
        } catch (error) {
            console.log('[fetchCountryInfo]', error);
        }
        return { country: this.unknownCountry };
    };

    getSymbolsInfo = async (): Promise<CryptoSymbolsResponse> => {
        try {
            const response = await this.request(this.SYMBOLS_INFO, {}, 'GET');
            if (!response || response.length === 0) {
                return [];
            }
            return response;
        } catch (error) {
            console.log('[getSymbolsInfo]', error);
        }
        return [];
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
    ): Promise<ExchangeTrade[] | undefined> => {
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
            const response = await this.request(this.BUY_LIST, {}, 'GET');
            return response;
        } catch (error) {
            console.log('[getBuyList]', error);
        }
    };

    getBuyQuotes = async (params: BuyTradeQuoteRequest): Promise<BuyTrade[] | undefined> => {
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

    getSellList = async (): Promise<SellListResponse | undefined> => {
        try {
            const response = await this.request(this.SELL_LIST, {}, 'GET');
            return response;
        } catch (error) {
            console.log('[getSellList]', error);
        }
    };

    getVoucherQuotes = async (
        params: SellVoucherTradeQuoteRequest,
    ): Promise<SellVoucherTradeQuoteResponse | undefined> => {
        try {
            const response: SellVoucherTradeQuoteResponse = await this.request(
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
            const response: SellVoucherTrade = await this.request(
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
            const response: SellVoucherTrade = await this.request(
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
            const response: SellFiatTradeQuoteResponse = await this.request(
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

    watchSellTrade = async (
        trade: SellFiatTrade,
        counter: number,
    ): Promise<WatchSellTradeResponse> => {
        try {
            const response: WatchSellTradeResponse = await this.request(
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

    getP2pList = async (): Promise<P2pListResponse | undefined> => {
        try {
            return await this.request(this.P2P_LIST, {}, 'GET');
        } catch (error) {
            console.log('[getP2pList]', error);
        }
    };

    getP2pQuotes = async (request: P2pQuotesRequest): Promise<P2pQuotesResponse | undefined> => {
        try {
            return await this.request(this.P2P_QUOTES, request, 'POST');
        } catch (error) {
            console.log('[getP2pQuotes]', error);
        }
    };

    doP2pTrade = async (request: P2pTradeRequest): Promise<P2pTradeResponse | undefined> => {
        try {
            return await this.request(this.P2P_TRADE, request, 'POST');
        } catch (error) {
            console.log('[doP2pTrade]', error);
        }
    };

    watchSavingsTrade = async (
        savingsTradeId: string,
        tradeItemId: string,
    ): Promise<WatchSavingTradeItemResponse> => {
        try {
            const response: WatchSavingTradeItemResponse = await this.request(
                `${this.SAVINGS_WATCH_ITEM}/${savingsTradeId}/${tradeItemId}`,
                {},
                'GET',
            );
            return response;
        } catch (error) {
            console.log('[watchSavingsTrade]', error);
            return { code: error.toString() };
        }
    };

    getSavingsList = async (): Promise<SavingsListResponse | undefined> => {
        try {
            const response: SavingsListResponse = await this.request(this.SAVINGS_LIST, {}, 'GET');
            return response;
        } catch (error) {
            console.log('[getSavingsList]', error);
        }
    };

    initSavingsTrade = async (
        savingsParameters: InitSavingsTradeRequest,
    ): Promise<FormResponse | undefined> => {
        try {
            const response: FormResponse = await this.request(
                this.SAVINGS_INIT,
                savingsParameters,
                'POST',
            );
            return response;
        } catch (error) {
            console.log('[initSavingsTrade]', error);
        }
    };

    getSavingsTrade = async (): Promise<SavingsTradeResponse | undefined> => {
        try {
            const response: SavingsTradeResponse = await this.request(
                this.SAVINGS_TRADE,
                {},
                'GET',
            );
            return response;
        } catch (error) {
            console.log('[getSavingsTrade]', error);
        }
    };

    doSavingsTrade = async (
        requestBody: SavingsTradeRequest,
    ): Promise<SavingsTradeResponse | undefined> => {
        try {
            const response: SavingsTradeResponse = await this.request(
                this.SAVINGS_TRADE,
                requestBody,
                'POST',
            );
            return response;
        } catch (error) {
            console.log('[doSavingsTrade]', error);
        }
    };

    watchKYCStatus = async (
        apiHeaderValue: string,
    ): Promise<SavingsTradeKYCStatusResponse | undefined> => {
        try {
            return await this.request(this.SAVINGS_WATCH_KYC, {}, 'GET', apiHeaderValue);
        } catch (error) {
            console.log('[watchKYCStatus]', error);
        }
    };

    getCoinLogoUrl(coin: string): string {
        return `${this.getApiServerUrl()}/images/coins/suite/${coin}.svg`;
    }
}

const invityAPI = new InvityAPI();

export default invityAPI;
