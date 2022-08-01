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
import type { InvityServerEnvironment, InvityServers } from '@wallet-types/invity';

/** BEGIN: TEMPORARILY PLACED TYPES - Will be moved to @types/invity-api */
export type SavingsPaymentMethod = 'bankTransfer';

export interface InitSavingsTradeRequest {
    returnUrl: string;
    paymentFrequency: PaymentFrequency;
    amount: string;
    fiatCurrency: string;
    cryptoCurrency: string;
    exchange: string;
    country: string;
}

export interface SavingsErrorResponse {
    code?: string;
    error?: string;
}

// starts after login to invity account
// 0 - external site
//      BTCD: nothing
//      Swan: redirect to OIDC
// 1 - your credentials
//      BTCD: personal info (name+surname+phone+DOB?)
//      Swan: personal info (phone)
// 2 - your phone number
//      BTCD: sms verification
//      Swan: nothing
// 3 - KYC verification
//      BTCD: internal KYC, document type, KYC upload (we can move forward)
//      Swan: KYC status page (is it blocking until done?)
// 4 - AML
//      BTCD: AML
//      Swan: nothing
// 5 - Bank account
//      BTCD: nothing
//      Swan: enter bank account + server side validation on change
// 6 - Upload wallet screenshot for non-Trezor ClientApp?
//      BTCD: upload wallet screenshot only for non-Trezor ClientApp
//      Swan: ???
// 7 - DCA setup
//      BTCD: savings parameters, choose crypto address
//      Swan: savings parameters, choose crypto address(es)
// 8 - DCA setup
//      BTCD: confirmation
//      Swan: confirmation

type SavingsStepEnabled = {
    /** Indicates whether the step is enabled (meaning the flow process has to go through this step) or this step will be skipped. */
    isEnabled: boolean;
};

type SavingsStepAfterLogin = SavingsStepEnabled;

type SavingsStepCredentials = SavingsStepEnabled & {
    isFamilyNameEnabled: boolean;
    isGivenNameEnabled: boolean;
    isPhoneEnabled: boolean;
};

type SavingsStepPhoneVerification = SavingsStepEnabled & {
    /** Determines way of phone number verification.
     * - ClientApp - we verify the user's phone number
     * - External - we provide the phone number to partner to be verified by the partner or externally
     */
    phoneVerificationType: 'ClientApp' | 'External';
};

type SavingsStepKYC = SavingsStepEnabled & {
    /** Determines way KYC document upload.
     * - ClientApp - we handover the KYC documents to partner right from the user
     * - External - upload is managed fully by our partner
     */
    documentUploadType: 'ClientApp' | 'External';
    isWaitingForKYCResult: boolean;
};

type SavingsStepAML = SavingsStepEnabled;

type SavingsStepBankAccount = SavingsStepEnabled;
type SavingsStepCryptoWalletVerification = SavingsStepEnabled;

type SavingsStepParameters = SavingsStepEnabled & {
    receivingAddressCount: number;
};

type SavingsStepPaymentInfo = SavingsStepEnabled;

export interface SavingsProviderFlow {
    /** Defines what should happen after login. */
    afterLogin: SavingsStepAfterLogin;
    credentials: SavingsStepCredentials;
    phoneVerification: SavingsStepPhoneVerification;
    kyc: SavingsStepKYC;
    aml: SavingsStepAML;
    bankAccount: SavingsStepBankAccount;
    cryptoWalletVerification: SavingsStepCryptoWalletVerification;
    parameters: SavingsStepParameters;
    paymentInfo: SavingsStepPaymentInfo;
}

export interface SavingsProviderInfo {
    /** Name of provider as our identifier e.g.: btcdirect. */
    name: string;

    /** Official name of provider e.g.: BTC Direct. */
    companyName: string;

    /** Name of logo file. */
    logo: string;

    /** Indicates whether the provider is marked as active or not. The setting comes from configuration. */
    isActive: boolean;

    /** Coins which user can save into. */
    tradedCoins: string[];

    /** Fiat currencies (3-letter ISO codes) with which can the savings be set up. */
    tradedFiatCurrencies: string[];

    /** Supported countries (2-letter ISO codes) of where provider offers the savings. */
    supportedCountries: string[];

    /** Provider's support URL. */
    supportUrl?: string;

    /** Defines methods of how a user can pay to save crypto. */
    paymentMethods?: SavingsPaymentMethod[];

    /** List of document types required by provider's KYC process. User has to choose one. */
    identityDocuments: SavingsProviderInfoIdentityDocument[];

    /** URL where a privacy policy of the provider is located. */
    privacyPolicyUrl: string;

    /** Defines a savings flow. Different providers might have different steps in the savings flow. */
    flow: SavingsProviderFlow;

    /** List of payment frequencies selectable by user during savings setup. */
    setupPaymentFrequencies: PaymentFrequency[];

    /** List of payment amounts selectable by user during savings setup. */
    setupPaymentAmounts: string[];

    minimumPaymentAmountLimit: number;

    maximumPaymentAmountLimit: number;

    defaultPaymentFrequency: PaymentFrequency;

    defaultPaymentAmount: number;
}

export interface SavingsProviderInfoIdentityDocument {
    documentType: SavingsTradeUserKYCStartDocumentType;
    documentImageSides: SavingsTradeUserKYCStartDocumentImageSide[];
    isRequired?: boolean;
}

export interface SavingsListResponse {
    country: string;
    providers: SavingsProviderInfo[];
}

export type SavingsSetupStatus =
    /** Show select options what kind of documents the will be KYC'ed. */
    | 'KYC'
    /** More like questionnaire - can't fail. */
    | 'AML'
    /** User needs to verify crypto wallet. */
    | 'WalletVerification'
    /** User needs to submit bank account. */
    | 'SubmitBankAccount'
    /** User setups savings plan parameters (frequency, amount, etc.). */
    | 'SetSavingsParameters'
    /** Partner has generated payment info parameters. */
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
    | 'Failed'
    /** KYC status check ended up in error state. */
    | 'Error';

export type SavingsAMLStatus =
    /** AML process didn't start yet. */
    | 'Open'
    /** AML process passed successfully. */
    | 'Verified';

export type PaymentFrequency = 'Daily' | 'Weekly' | 'Biweekly' | 'Monthly' | 'Quarterly';

export interface SavingsTradePlannedPayment {
    /** Our id. */
    paymentId: string;

    /** Partner's id. */
    partnerPaymentId?: string;

    fiatAmount?: string;
    cryptoAmount?: string;
    plannedPaymentAt: string;
    paymentInfo: SavingsPaymentInfo;
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
    | 'Selfie'
    | 'WalletVerification';

export type SavingsTradeUserKYCStartDocumentImageSide =
    | 'Front'
    | 'Back'
    | 'Selfie'
    | 'SecondSelfie'
    | 'ProofOfResidency'
    | 'WalletVerification';

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

export interface BankAccount {
    bankAccount?: string; // IBAN
    bic?: string;
    holder?: string;
    verified?: boolean;
    routingNumber?: string; // For ACH (US)
    accountNumber?: string; // For ACH (US)
    name?: string;
    type?: string;
}

export interface SavingsTrade {
    id?: string;
    country?: string;
    status?: SavingsStatus;
    kycStatus?: SavingsKYCStatus;
    amlStatus?: SavingsAMLStatus;

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

    paymentMethod?: SavingsPaymentMethod;

    /** Name of savings provider. */
    exchange: string;

    /** Crypto address where provider sends crypto. */
    receivingCryptoAddresses?: string[];

    /** Indicates whether the user is registered in partner's system. */
    isUserRegisteredInPartnerSystem?: boolean;

    userRegistration?: SavingsTradeUserRegistration;

    userKYCStart?: SavingsTradeUserKYCStart[];

    amlQuestions?: SavingsTradeAMLQuestion[];

    amlAnswers?: SavingsTradeAMLAnswer[];

    paymentInfo?: SavingsPaymentInfo;

    tradeItems?: SavingsTradeItem[];
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

export interface SavingsTradeErrorResponse extends SavingsErrorResponse {
    code?:
        | 'AppIDRequired'
        | 'ExchangeNotFound'
        | 'SavingsTradeCountryRequired'
        | 'SavingsTransactionNotFound'
        | 'SavingsTransactionExists'
        | 'GetUserInfoFailed'
        | 'FlowStepDisabled'
        | 'UnknownStatus';
}

export interface SavingsTradeResponse extends SavingsTradeErrorResponse {
    trade?: SavingsTrade;

    /** Payments in savings plan. */
    payments?: SavingsTradePlannedPayment[];
}

export interface SavingsTradesResponse extends SavingsTradeErrorResponse {
    trades: SavingsTrade[];
}

export interface SavingsKYCInfoSuccessResponse {
    status: 'Success';
    documentTypes: SavingsTradeUserKYCStartDocumentType[];
}

export type SavingsKYCInfoResponse = SavingsKYCInfoSuccessResponse | SavingsErrorResponse;

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

export interface SavingsTradeKYCStatusSuccessfulResponse {
    kycStatus?: SavingsKYCStatus;
}

export interface SavingsTradeKYCStatusErrorResponse extends SavingsErrorResponse {
    code?:
        | 'GetIdentityInfoFailed'
        | 'SavingsTransactionNotFound'
        | 'ExchangeNotFound'
        | 'GetUserInfoFailed'
        | 'UserNotFoundInPartnerSystem';
}

export type SavingsTradeKYCStatusResponse = SavingsTradeKYCStatusSuccessfulResponse &
    SavingsTradeKYCStatusErrorResponse;

export type SavingsTradeItemStatus =
    | 'Cancelled'
    | 'Pending'
    | 'InProgress'
    | 'Blocked'
    | 'Completed'
    | 'Refunded'
    | 'Error';

export interface SavingsTradeItem {
    id: string;
    savingsTradeId: string;
    exchange: string;
    status: SavingsTradeItemStatus;
    receiveAddress: string;
    fiatStringAmount: string;
    fiatCurrency: string;
    receiveStringAmount: string;
    receiveCurrency: string;
    paymentMethod: SavingsPaymentMethod;
    created: string;
}

export interface WatchSavingTradeItemErrorResponse extends SavingsErrorResponse {
    code?:
        | 'SavingsTradeIdRequired'
        | 'SavingsTradeItemIdRequired'
        | 'SavingsTradeItemNotFound'
        | 'SavingsTransactionNotFound';
}

export interface WatchSavingTradeItemResponse extends WatchSavingTradeItemErrorResponse {
    savingsTradeItem?: SavingsTradeItem;
}

export interface AfterLoginErrorResponse extends SavingsErrorResponse {
    code?: 'ReturnUrlRequired' | 'ExchangeNotFound' | 'AfterLoginFailed';
}
export interface AfterLoginSuccessResponse {
    form?: {
        formMethod: 'GET';
        formAction: string;
        fields: Record<string, string>;
    };
}

export type AfterLoginResponse = AfterLoginSuccessResponse & AfterLoginErrorResponse;

export interface SubmitPhoneNumberResponse extends SavingsErrorResponse {
    code?: 'ExchangeNotFound' | 'InternalError' | 'SavingsTransactionNotFound';
    form?: {
        formMethod: 'GET';
        formAction: string;
        fields: Record<string, string>;
    };
}

export const SavingsTradeItemFinalStatuses: SavingsTradeItemStatus[] = [
    'Blocked',
    'Cancelled',
    'Completed',
    'Error',
    'Refunded',
];
export const SavingsTradeKYCFinalStatuses: SavingsKYCStatus[] = ['Failed', 'Verified'];

export interface VerifySmsCodeRequest {
    code: string;
    phoneNumber: string;
}

export interface VerifySmsCodeSuccessResponse {
    status: 'Verified';
}

export interface VerifySmsCodeInvalidResponse {
    status: 'VerificationCodeInvalid';
}

export interface VerifySmsCodeErrorResponse {
    status: 'Error';
    errorCode: 'VerificationCodeRequired' | 'PhoneNumberRequired' | 'InternalError';
    errorMessage: string;
}

export type VerifySmsCodeResponse =
    | VerifySmsCodeSuccessResponse
    | VerifySmsCodeInvalidResponse
    | VerifySmsCodeErrorResponse;

export interface SendVerificationSmsErrorResponse {
    status: 'Error';
    errorCode: 'InternalError' | 'SmsRequestLimitExceeded';
    errorMessage: string;
}

export interface SendVerificationSmsSuccessResponse {
    status: 'SmsQueued';
    verificationCodeExpirationInSeconds: number;
}

export type SendVerificationSmsResponse =
    | SendVerificationSmsSuccessResponse
    | SendVerificationSmsErrorResponse;

export interface FormResponse {
    form?: {
        formMethod: 'GET' | 'POST' | 'IFRAME';
        formAction: string;
        fields: Record<string, string>;
    };
    error?: string;
}

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

    servers = {
        production: 'https://exchange.trezor.io',
        staging1: 'https://staging-exchange1.sldev.cz',
        staging2: 'https://staging-exchange2.sldev.cz',
        localhost: 'http://localhost:3330',
    } as InvityServers;

    private serverEnvironment = 'production' as InvityServerEnvironment;

    // info service
    private DETECT_COUNTRY_INFO = '/api/info/country';
    private GET_COUNTRY_INFO = '/api/info/country/{{country}}';

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

    // sell service
    private SELL_LIST = '/api/sell/list';
    private VOUCHER_QUOTES = '/api/sell/voucher/quotes';
    private VOUCHER_REQUEST_TRADE = '/api/sell/voucher/trade';
    private VOUCHER_CONFIRM_TRADE = '/api/sell/voucher/confirm';
    private SELL_FIAT_QUOTES = '/api/sell/fiat/quotes';
    private SELL_FIAT_DO_TRADE = '/api/sell/fiat/trade';
    private SELL_FIAT_CONFIRM = '/api/sell/fiat/confirm';
    private SELL_FIAT_WATCH_TRADE = '/api/sell/fiat/watch/{{counter}}';

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

    getExchangeCoins = async (): Promise<ExchangeCoinInfo[]> => {
        try {
            const response = await this.request(this.EXCHANGE_COINS, {}, 'GET');
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
}

const invityAPI = new InvityAPI();

export default invityAPI;
