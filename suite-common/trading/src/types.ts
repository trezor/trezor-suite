import type {
    BuyCryptoPaymentMethod,
    BuyProviderInfo,
    BuyTrade,
    BuyTradeStatus,
    CryptoId,
    ExchangeProviderInfo,
    ExchangeTrade,
    ExchangeTradeStatus,
    FiatCurrencyCode,
    SellCryptoPaymentMethod,
    SellFiatTrade,
    SellProviderInfo,
    SellTradeStatus,
    WatchBuyTradeResponse,
    WatchExchangeTradeResponse,
    WatchSellTradeResponse,
} from 'invity-api';

import { type CountryCode } from '@suite-common/geolocation';
import {
    type Network,
    type NetworkConfig,
    type NetworkDisplaySymbol,
    type NetworkSymbol,
} from '@suite-common/wallet-config';
import {
    type Account,
    type AccountKey,
    type BaseCurrencyOption,
    type FormState,
    type GeneralPrecomposedTransactionFinal,
} from '@suite-common/wallet-types';
import { type PROTO } from '@trezor/connect';
import { type SerializedError } from '@trezor/connect-common/src/constants/errors';
import { type Timer } from '@trezor/react-utils';
import { type Err, type Ok, type PrimitiveType } from '@trezor/type-utils';

import type * as constants from './constants';

export type InvityServerEnvironment = 'production' | 'staging' | 'dev' | 'localhost';
export type InvityServers = Record<InvityServerEnvironment, string>;

export type TradingBuyType = 'buy';
export type TradingSellType = 'sell';
export type TradingExchangeType = 'exchange';
export type TradingType = TradingBuyType | TradingSellType | TradingExchangeType;
export type TradingTypeWithConcierge = TradingType | 'concierge';

export type TradingTradeBuySellType = Exclude<TradingType, TradingExchangeType>;
export type TradingTradeBuyExchangeType = Exclude<TradingType, TradingSellType>;
export type TradingTradeSellExchangeType = Exclude<TradingType, TradingBuyType>;

type TradingAssetOptionBase = {
    id: CryptoId;
    coingeckoId: NonNullable<NetworkConfig['coingeckoId']>;
    networkName: NetworkConfig['name'];
    networkSymbol: NetworkSymbol;
};

export type TradingAssetOptionNativeToken = TradingAssetOptionBase & {
    isNativeToken: true;
    name: NetworkConfig['name'];
    symbol: NetworkSymbol;
    displaySymbol: NetworkDisplaySymbol;
    contractAddress: null | typeof constants.CONTRACT_ADDRESS_FOR_NATIVE_TOKEN;
};

export type TradingAssetOptionWithContractAddress = TradingAssetOptionBase & {
    isNativeToken: false;
    name: string;
    symbol: string;
    displaySymbol: string;
    contractAddress: string;
};

export type TradingAssetOption =
    | TradingAssetOptionNativeToken
    | TradingAssetOptionWithContractAddress;

// information about created trade
export type TradingTradeType = BuyTrade | SellFiatTrade | ExchangeTrade;
export type TradingTradeMapProps = {
    buy: BuyTrade;
    sell: SellFiatTrade;
    exchange: ExchangeTrade;
};
export type TradingTradeBuySellMapProps = Omit<TradingTradeMapProps, 'exchange'>;

export type TradingWatchTradeResponsePropsMap = {
    buy: WatchBuyTradeResponse;
    sell: WatchSellTradeResponse;
    exchange: WatchExchangeTradeResponse;
};

export type TradingPaymentMethodType = BuyCryptoPaymentMethod | SellCryptoPaymentMethod;
export type TradingTradeStatusType = BuyTradeStatus | SellTradeStatus | ExchangeTradeStatus;
export type TradingUtilsProvidersProps = {
    [name: string]: {
        logo: string;
        companyName: string;
        brandName?: string;
    };
};

export type TradingParsedCryptoIdProps = {
    networkId: CryptoId;
    contractAddress: string | undefined;
};

export type TradingFiatCurrenciesProps = Map<FiatCurrencyCode, string>;
export type TradingBuyPaymentMethodProps = BuyCryptoPaymentMethod | '';
export type TradingSellPaymentMethodProps = SellCryptoPaymentMethod | '';
export type TradingPaymentMethodProps = TradingPaymentMethodType | '';
export type TradingPaymentMethodListProps = {
    value: TradingPaymentMethodProps;
    label: string;
    receiveAmount?: string;
    symbol?: string;
};

type TradingCommonTransaction = {
    date: string;
    key?: string;
};
export type TradingTransactionBuy = TradingCommonTransaction & {
    tradeType: TradingBuyType;
    data: BuyTrade;
    selectedAccountKey: Account['key'] | undefined;
    receiveAccountKey: Account['key'] | undefined;
};
export type TradingTransactionSell = TradingCommonTransaction & {
    tradeType: TradingSellType;
    data: SellFiatTrade;
    sendAccountKey: Account['key'] | undefined;
};
export type TradingTransactionExchange = TradingCommonTransaction & {
    tradeType: TradingExchangeType;
    data: ExchangeTrade;
    receiveAccountKey?: Account['key'];
    sendAccountKey: Account['key'] | undefined;
};
export type TradingTransaction =
    | TradingTransactionBuy
    | TradingTransactionSell
    | TradingTransactionExchange;

export type TradingTransactionStatus = TradingTransaction['data']['status'];

export interface TradingSelectAssetOptionGroupProps {
    type: 'group';
    label: string;
    networkName?: string;
    coingeckoId?: string;
}

export type TradingFiatCurrencyOption = {
    value: FiatCurrencyCode;
    label: string;
};

export type TradingCountryCode = CountryCode | 'unknown';

export type TradingCountryOption = {
    value: TradingCountryCode;
    label: string;
    shortLabel: string;
    codeAlpha3: string;
    flag: string;
    name: string;
};

export type TradingCountrySubdivisionOption = {
    value: string;
    label: string;
    name: string;
};

export type TradingBuyFormProps = {
    [constants.TRADING_FORM_FIAT_INPUT]?: string;
    [constants.TRADING_FORM_CRYPTO_INPUT]?: string;
    [constants.TRADING_FORM_FIAT_CURRENCY_SELECT]: TradingFiatCurrencyOption;
    [constants.TRADING_FORM_CRYPTO_CURRENCY_SELECT]: TradingAssetOption;
    [constants.TRADING_FORM_COUNTRY_SELECT]: TradingCountryOption;
    [constants.TRADING_FORM_COUNTRY_SUBDIVISION_SELECT]?: TradingCountrySubdivisionOption;
    [constants.TRADING_FORM_PAYMENT_METHOD_SELECT]?: TradingPaymentMethodListProps;
    [constants.TRADING_FORM_PROVIDER_SELECT]?: string;
    [constants.TRADING_FORM_AMOUNT_IN_CRYPTO]: boolean;
    [constants.TRADING_BUY_RECEIVE_ADDRESS]?: string;
};

export type OtcProviderType = {
    name: string;
    url: string;
};

export type OTCLink = OtcProviderType & {
    allowedCountries: string[];
};

export type TradingOTC = {
    country: CountryCode;
    minFiatLimits: Record<FiatCurrencyCode, number>;
    links: OTCLink[];
};

export type TradingProviderInfo = BuyProviderInfo | ExchangeProviderInfo | SellProviderInfo;

export type TradingAmountLimitProps = {
    currency: string;
    minCrypto?: string;
    maxCrypto?: string;

    minFiat?: string;
    maxFiat?: string;
};

export type TradingExchangeAmountLimitProps = Pick<
    TradingAmountLimitProps,
    'currency' | 'minCrypto' | 'maxCrypto'
>;

export type TradingExchangeRateType =
    | typeof constants.TRADING_EXCHANGE_RATE_FIXED
    | typeof constants.TRADING_EXCHANGE_RATE_FLOATING;

export type TradingExchangeFormType =
    | typeof constants.TRADING_EXCHANGE_FORM_CEX
    | typeof constants.TRADING_EXCHANGE_FORM_DEX;

export type TradingExchangeKycFilter =
    | typeof constants.TRADING_EXCHANGE_COMPARATOR_KYC_FILTER_ALL
    | typeof constants.TRADING_EXCHANGE_COMPARATOR_KYC_FILTER_NO_KYC;

export type TradingExchangeRateFilter =
    | typeof constants.TRADING_EXCHANGE_COMPARATOR_RATE_FILTER_ALL
    | typeof constants.TRADING_EXCHANGE_COMPARATOR_RATE_FILTER_FIXED_CEX
    | typeof constants.TRADING_EXCHANGE_COMPARATOR_RATE_FILTER_FLOATING_CEX
    | typeof constants.TRADING_EXCHANGE_COMPARATOR_RATE_FILTER_DEX;

export type TradingAssetSellOption = TradingAssetOption & {
    accountKey: AccountKey;
};

export interface TradingExchangeFormProps extends FormState {
    [constants.TRADING_FORM_RECEIVE_CRYPTO_CURRENCY_SELECT]: TradingAssetOption | null;
    [constants.TRADING_FORM_SEND_CRYPTO_CURRENCY_SELECT]: TradingAssetSellOption | undefined;
    [constants.TRADING_FORM_AMOUNT_IN_CRYPTO]: boolean;
    [constants.TRADING_EXCHANGE_RATE]: TradingExchangeRateType;
    [constants.TRADING_EXCHANGE_FORM]: TradingExchangeFormType;
    [constants.TRADING_EXCHANGE_COMPARATOR_KYC_FILTER]: TradingExchangeKycFilter;
    [constants.TRADING_EXCHANGE_COMPARATOR_RATE_FILTER]: TradingExchangeRateFilter;
    [constants.TRADING_EXCHANGE_FROM_ADDRESS]?: string | undefined;
    [constants.TRADING_EXCHANGE_RECEIVE_ADDRESS]?: string | undefined;
    [constants.TRADING_EXCHANGE_EXTRA_FIELD]?: string | undefined;
    [constants.TRADING_FORM_PROVIDER_SELECT]?: string;
}

export type MinimalExchangeFormProps = {
    outputs: { amount?: string }[];
    receiveCryptoSelect?: Pick<TradingAssetOption, 'id'> | null;
    sendCryptoSelect?: Pick<TradingAssetSellOption, 'id'> | null;
    setMaxOutputId?: number;
    receiveAddress?: string;
    fromAddress?: string;
};

export type TradingExchangeStepType = 'RECEIVING_ADDRESS' | 'SEND_TRANSACTION' | 'SIGN_DATA';

export type TradingSendRejectedProps<TranslationKey extends string = string> = {
    type: 'error' | 'sign-tx-error' | 'sign-transaction-timeout';
    error: {
        id: TranslationKey;
        values?: Record<string, PrimitiveType>;
    };
};

export type TradingExchangeUserConsentProps = {
    provider: string;
    isDex: boolean;
    send: string;
    receive: string;
};

export type TradingSignAndPushSendFormTransactionProps = {
    formState: FormState;
    precomposedTransaction: GeneralPrecomposedTransactionFinal;
    selectedAccount: Account;
    paymentRequests?: PROTO.PaymentRequest[];
};

export type TradingSellStepType = 'BANK_ACCOUNT' | 'SEND_TRANSACTION';

export interface TradingSellFormProps extends FormState {
    [constants.TRADING_FORM_SEND_CRYPTO_CURRENCY_SELECT]: TradingAssetSellOption | undefined;
    [constants.TRADING_FORM_PAYMENT_METHOD_SELECT]?: TradingPaymentMethodListProps;
    [constants.TRADING_FORM_COUNTRY_SELECT]: TradingCountryOption;
    [constants.TRADING_FORM_COUNTRY_SUBDIVISION_SELECT]?: TradingCountrySubdivisionOption;
    [constants.TRADING_FORM_AMOUNT_IN_CRYPTO]: boolean;
    [constants.TRADING_FORM_PROVIDER_SELECT]?: string;
}

export type MinimalSellFormProps = {
    outputs: { amount?: string; fiat?: string; currency: Pick<BaseCurrencyOption, 'value'> }[];
    sendCryptoSelect: Pick<TradingAssetSellOption, 'id'> | undefined;
    countrySelect: TradingCountryOption;
    countrySubdivisionSelect?: TradingCountrySubdivisionOption;
    amountInCrypto: boolean;
    setMaxOutputId?: number;
};

export type TradingSellUserConsentProps = {
    provider: string;
    cryptoCurrency: CryptoId;
};

export type HandleBuyRequestThunkProps = {
    formValues: TradingBuyFormProps;
    network: Network;
    timer: Timer;
    shouldSendInSats: boolean | undefined;
};

export type HandleExchangeRequestThunkProps = {
    formValues: MinimalExchangeFormProps;
    network: Network;
    account: Account;
    timer: Timer;
    shouldSendInSats: boolean | undefined;
    composeRequestCallback: () => void;
};

export type HandleSellRequestThunkProps = {
    formValues: MinimalSellFormProps;
    network: Network;
    timer: Timer;
    shouldSendInSats: boolean | undefined;
    composeRequestCallback: () => void;
};

export type TradingVerifiedAddress =
    | {
          address: string;
          path?: string;
          mac?: string;
      }
    | undefined;

export type TradingFulfillValue = Ok<{ txid: string }> | Err<SerializedError> | undefined;
