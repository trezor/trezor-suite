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
    BankAccount,
} from 'invity-api';
import { isDesktop } from '@suite-utils/env';
import type {
    AccountInfoResponse,
    AccountSettings,
    AccountUpdateResponse,
    InvityServerEnvironment,
    InvityServers,
} from '@wallet-types/invity';
import { resolveStaticPath } from '@suite-utils/build';
import { getPrefixedURL } from '@suite-utils/router';

/** BEGIN: TEMPORARILY PLACED TYPES - Will be moved to @types/invity-api */
export type SavingsPaymentMethods = 'bankTransfer';

export interface SavingsErrorResponse {
    status: 'Error';
    errors: string[];
}

export interface SavingsProviderInfo {
    /** Name of provider as our identifier e.g.: btcdirect. */
    name: string;

    /** Official name of provider e.g.: BTC Direct. */
    companyName: string;

    /** Name of logo file. */
    logo: string;

    /** Indicates wheter the provider is marked as active or not. The setting comes from configuration. */
    isActive: boolean;

    /** Coins which user can save into. */
    tradedCoins: string[];

    /** Fiat currencies (3-letter ISO codes) with which can the savings be set up. */
    tradedFiatCurrencies?: string[];

    /** Supported countries (2-letter ISO codes) of where provider offers the savings. */
    supportedCountries: string[];

    /** Provider's support URL. */
    supportUrl?: string;

    /** Defines methods of how a user can pay to save crypto. */
    paymentMethods?: SavingsPaymentMethods[];

    isClientFromUnsupportedCountry: boolean;

    /** List of document types required by provider's KYC process. User has to choose one. */
    identityDocuments: SavingsProviderInfoIdentityDocument[];

    /** URL where a privacy policy of the provider is located. */
    privacyPolicyUrl: string;
}

export interface SavingsProviderInfoIdentityDocument {
    documentType: SavingsTradeUserKYCStartDocumentType;
    documentImageSides: SavingsTradeUserKYCStartDocumentImageSide[];
    isRequired?: boolean;
}

export interface SavingsListResponse {
    // TODO: Need country here?
    country: string;
    providers: SavingsProviderInfo[];
}

export type SavingsSetupStatus =
    /** Show select options what kind of documents the will be KYC'ed. */
    | 'KYC'
    /** More like questionare - can't fail. */
    | 'AML'
    /** User needs to verify crypto wallet. */
    | 'WalletVerification'
    /** User setups savings plan parameters (frequency, amount, etc.). */
    | 'SetSavingsParameters'
    /** Partner has generated payment details. */
    | 'ConfirmPaymentInfo';

export type SavingsStatus = SavingsSetupStatus | 'Cancelled' | 'Active';
export type SavingsKYCStatus =
    /** KYC process didn't start yet. */
    | 'Open'
    /** KYC process is in progress. Might take some time to resolve. */
    | 'InProgress'
    /** KYC process passed successfully. */
    | 'Verified'
    /** KYC docs are invalid or anything could be wrong. Expecting reason from our partner to handover to the user. */
    | 'Failed';

export type SavingsAMLStatus =
    /** AML process didn't start yet. */
    | 'Open'
    /** AML process passed successfully. */
    | 'Verified';

export type PaymentFrequency = 'Weekly' | 'Biweekly' | 'Monthly' | 'Quarterly';

export type SavingsTradePaymentStatus =
    | 'Cancelled'
    | 'Pending'
    | 'InProgress'
    | 'Blocked'
    | 'Completed'
    | 'Refunded';

export interface SavingsTradePayment {
    /** Our id. */
    paymentId: string;

    /** Partner's id. */
    partnerPaymentId: string;

    status: SavingsTradePaymentStatus;
    fiatAmount: number;
    cryptoAmount: number;
}

export interface SavingsTradeUserRegistration {
    /** Or first name as we are used to in most of the European countries. */
    givenName: string;

    /** Or last name as we are used to in most of the European countries. */
    familyName: string;

    /** Birth day in ISO format. For example: 2021-07-14T14:00:00.000Z - using date.toISOString() on client. */
    dateOfBirth: string;

    phoneNumber: string;
}

export type SavingsTradeUserKYCStartDocumentType =
    | 'Passport'
    | 'IdentityCard'
    | 'DrivingLicence'
    | 'Selfie';

export type SavingsTradeUserKYCStartDocumentImageSide =
    | 'Front'
    | 'Back'
    | 'Selfie'
    | 'SecondSelfie'
    | 'ProofOfResidency';

export interface SavingsTradeUserKYCStartDocumentImage {
    documentSide: SavingsTradeUserKYCStartDocumentImageSide;
    data: string;
}

export interface SavingsTradeUserKYCStart {
    documentType: SavingsTradeUserKYCStartDocumentType;
    documentImages: SavingsTradeUserKYCStartDocumentImage[];
}

export interface SavingsTradeAMLQuestion {
    key: string;
    label: string;
    answerOptions: string[];
}

export interface SavingsTrade {
    status?: SavingsStatus;
    kycStatus?: SavingsKYCStatus;
    amlStatus?: SavingsAMLStatus;

    errors?: string[];

    /** Customer's bank account from which payments should be paid to receive crypto. */
    bankAccount?: BankAccount;

    /** Amount of money to be paid recurrently. */
    fiatStringAmount?: string;

    /** Fiat currency of recurrent payment. */
    fiatCurrency?: string;

    /** Crypto currency of recurrent payment. */
    cryptoCurrency?: string;

    /** How often payment should be paid by customer. */
    paymentFrequency?: PaymentFrequency;

    /** Name of savings provider. */
    exchange: string;

    /** Crypto address where provider sends crypto. */
    receivingCryptoAddress?: string;

    /** Indicates whether the user is registred in partner's system. */
    isUserRegistredInPartnerSystem?: boolean;

    userRegistration?: SavingsTradeUserRegistration;

    userKYCStart?: SavingsTradeUserKYCStart[];

    amlQuestions?: SavingsTradeAMLQuestion[];

    amlAnswers?: SavingsTradeAMLAnswer[];

    paymentInfo?: SavingsPaymentInfo;

    // TODO: maybe encapsulate setup?
}

export interface SavingsPaymentInfo {
    name: string;
    iban: string;
    description: string;
    bic: string;
}

export interface SavingsTradeRequest {
    trade: SavingsTrade;
}

export interface SavingsTradeResponse {
    trade: SavingsTrade;

    /** Payments in savings plan. */
    payments?: SavingsTradePayment[];
}

export interface SavingsKYCInfoSuccessResponse {
    status: 'Success';
    documentTypes: SavingsTradeUserKYCStartDocumentType[];
}

export interface SavingsKYCInfoErrorResponse {
    status: 'Error';
    errors: string[];
}

export type SavingsKYCInfoResponse = SavingsKYCInfoSuccessResponse | SavingsKYCInfoErrorResponse;

export interface SavingsTradeAMLAnswer {
    key: string;
    answer: string;
}
export interface SavingsTradeAMLAnswersRequest {
    answers: SavingsTradeAMLAnswer[];
}

export interface SavingsAMLAnswersSuccessResponse {
    status: 'Success';
}

export type SavingsAMLAnswersResponse = SavingsAMLAnswersSuccessResponse | SavingsErrorResponse;

export interface VerifySmsCodeRequest {
    code: string;
}

export interface VerifySmsCodeSuccessResponse {
    status: 'Verified';
}

export interface VerifySmsCodeErrorResponse {
    status: 'Error';
    error: string;
}

export type VerifySmsCodeResponse = VerifySmsCodeSuccessResponse | VerifySmsCodeErrorResponse;

export interface SendVerificationSmsErrorResponse {
    status: 'Error';
    error: string;
}

export interface SendVerificationSmsSuccessResponse {
    status: 'SmsQueued';
}

export type SendVerificationSmsResponse =
    | SendVerificationSmsSuccessResponse
    | SendVerificationSmsErrorResponse;

export interface SavingsTradeKYCStatusSuccessfulResponse {
    status: 'Success';
    kycStatus: SavingsKYCStatus;
}

export type SavingsTradeKYCStatusResponse =
    | SavingsTradeKYCStatusSuccessfulResponse
    | SavingsErrorResponse;

/** END: TEMPORARILY PLACED TYPES - Will be moved to @types/invity-api */

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
    | SavingsTradeRequest
    | VerifySmsCodeRequest;

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

    private SAVINGS_LIST = '/savings/list';
    private SAVINGS_TRADE = '/account/savings/trade';
    private WATCH_KYC = '/account/savings/watch-kyc';

    private ACCOUNT_INFO = '/account/info';
    private ACCOUNT_SETTINGS = '/account/settings';
    private PHONE_SEND_VERIFICATION_SMS = '/account/phone/send-verification-sms';
    private PHONE_VERIFY_SMS_CODE = '/account/phone/verify-sms-code';

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

    getSavingsList = async (): Promise<SavingsListResponse | undefined> => {
        this.setProtectedAPI(true);
        try {
            const response: SavingsListResponse = await this.requestApiServer(
                this.SAVINGS_LIST,
                {},
                'GET',
            );
            return response;
        } catch (error) {
            console.log('[getSavingsList]', error);
        } finally {
            this.setProtectedAPI(false);
        }
    };

    getSavingsTrade = async (exchangeName: string): Promise<SavingsTradeResponse | undefined> => {
        this.setProtectedAPI(true);
        try {
            const response: SavingsTradeResponse = await this.requestApiServer(
                `${this.SAVINGS_TRADE}/${exchangeName}`,
                {},
                'GET',
            );
            return response;
        } catch (error) {
            console.log('[getSavingsTrade]', error);
        } finally {
            this.setProtectedAPI(false);
        }
    };

    doSavingsTrade = async (
        trade: SavingsTradeRequest,
    ): Promise<SavingsTradeResponse | undefined> => {
        this.setProtectedAPI(true);
        try {
            const response: SavingsTradeResponse = await this.requestApiServer(
                this.SAVINGS_TRADE,
                trade,
                'POST',
            );
            return response;
        } catch (error) {
            console.log('[doSavingsTrade]', error);
        } finally {
            this.setProtectedAPI(false);
        }
    };

    sendVerificationSms = async (): Promise<SendVerificationSmsResponse | undefined> => {
        this.setProtectedAPI(true);
        try {
            return await this.requestApiServer(this.PHONE_SEND_VERIFICATION_SMS, {}, 'POST');
        } catch (error) {
            console.log('[sendVerificationSms]', error);
        } finally {
            this.setProtectedAPI(false);
        }
    };

    saveAccountSettings = async (
        accountSettings: AccountSettings,
    ): Promise<AccountUpdateResponse | undefined> => {
        this.setProtectedAPI(true);
        try {
            return await this.requestApiServer(this.ACCOUNT_SETTINGS, accountSettings, 'POST');
        } catch (error) {
            console.log('[saveAccountSettings]', error);
        } finally {
            this.setProtectedAPI(false);
        }
    };

    verifySmsCode = async (code: string): Promise<VerifySmsCodeResponse | undefined> => {
        this.setProtectedAPI(true);
        try {
            return await this.requestApiServer(
                this.PHONE_VERIFY_SMS_CODE,
                { code } as VerifySmsCodeRequest,
                'POST',
            );
        } catch (error) {
            console.log('[verifySmsCode]', error);
        } finally {
            this.setProtectedAPI(false);
        }
    };

    watchKYCStatus = async (
        exchange: string,
    ): Promise<SavingsTradeKYCStatusResponse | undefined> => {
        this.setProtectedAPI(true);
        try {
            return await this.requestApiServer(`${this.WATCH_KYC}/${exchange}`, {}, 'GET');
        } catch (error) {
            console.log('[watchKYCStatus]', error);
        } finally {
            this.setProtectedAPI(false);
        }
    };

    logout = async (): Promise<string | undefined> => {
        try {
            const response = await fetch(`${this.getAuthServerUrl()}/self-service/logout/browser`, {
                credentials: 'include',
            });
            const responseJsonBody = await response.json();
            return responseJsonBody.logout_url;
        } catch (error) {
            console.log('[logout]', error);
        }
    };

    getCheckInvityAuthenticationUrl() {
        // TODO: this API client should do the request
        return `${this.getAuthServerUrl()}/sessions/whoami`;
    }

    private getInvityAuthenticationPageSrc(
        flow: 'login' | 'registration',
        afterVerificationReturnToPath?: string,
    ) {
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
        if (flow === 'registration' && afterVerificationReturnToPath) {
            // Handover URL where user should be redirected after registration and verification link in email was clicked.
            url.searchParams.append(
                'after_verification_return_to',
                `${window.location.origin}${getPrefixedURL(afterVerificationReturnToPath)}`,
            );
        }
        url.hash = this.getAuthServerUrl();
        return url.toString();
    }

    getLoginPageSrc() {
        return this.getInvityAuthenticationPageSrc('login');
    }

    getRegistrationPageSrc(afterVerificationReturnToPath: string) {
        return this.getInvityAuthenticationPageSrc('registration', afterVerificationReturnToPath);
    }

    // TODO:
    // async logout() {
    //     const response = await fetch(`${this.getAuthServerUrl()}/self-service/logout/browser`, {
    //         credentials: 'include',
    //     });
    //     const json = await response.json();
    //     if (json.logout_url) {
    //         window.location.replace(json.logout_url);
    //     }
    // }

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
