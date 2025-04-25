import { ReactNode } from 'react';

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

import { ExtendedMessageDescriptor } from '@suite-common/intl-types';
import { AccountType, NetworkSymbolExtended } from '@suite-common/wallet-config';
import type {
    Account,
    FormState,
    GeneralPrecomposedTransactionFinal,
} from '@suite-common/wallet-types';
import { PrimitiveType } from '@trezor/type-utils';

import * as constants from './constants';

export type InvityServerEnvironment = 'production' | 'staging' | 'dev' | 'localhost';
export type InvityServers = Record<InvityServerEnvironment, string>;

export type TradingBuyType = 'buy';
export type TradingSellType = 'sell';
export type TradingExchangeType = 'exchange';
export type TradingType = TradingBuyType | TradingSellType | TradingExchangeType;

export type TradingTradeBuySellType = Exclude<TradingType, TradingExchangeType>;
export type TradingTradeBuyExchangeType = Exclude<TradingType, TradingSellType>;

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
export type TradingPaymentMethodProps = BuyCryptoPaymentMethod | '';
export type TradingPaymentMethodListProps = {
    value: TradingPaymentMethodProps;
    label: string;
};

type TradingCommonTransaction = {
    date: string;
    key?: string;
    account: {
        descriptor: Account['descriptor'];
        symbol: Account['symbol'];
        accountType: Account['accountType'];
        accountIndex: Account['index'];
    };
};
export type TradingTransactionBuy = TradingCommonTransaction & {
    tradeType: TradingBuyType;
    data: BuyTrade;
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

export type TradingCryptoSelectItemProps = {
    badge?: ReactNode;
    symbol: NetworkSymbolExtended;
    cryptoName?: string;
    coingeckoId?: string;
    contractAddress: string | null;
    shouldTryToFetch?: boolean;
    value: CryptoId;
    label: string;
    ticker?: string;
    type: 'currency';
    balance?: string;
    networkName?: string;
};

export interface TradingSelectAssetOptionGroupProps {
    type: 'group';
    label: string;
    networkName?: string;
    coingeckoId?: string;
}

export type TradingCryptoSelectOptionProps =
    | TradingCryptoSelectItemProps
    | TradingSelectAssetOptionGroupProps;

export interface TradingInfoProps {
    cryptoIdToPlatformName: (cryptoId: CryptoId) => string | undefined;
    cryptoIdToCoinName: (cryptoId: CryptoId) => string | undefined;
    cryptoIdToCoinSymbol: (cryptoId: CryptoId) => string | undefined;
    cryptoIdToNativeCoinSymbol: (cryptoId: CryptoId) => string | undefined;
    cryptoIdToSymbolAndContractAddress: (cryptoId: CryptoId | undefined) => {
        coinSymbol: NetworkSymbolExtended | undefined;
        contractAddress: string | undefined;
    };
    buildCryptoOptions: (
        cryptoIds: Set<CryptoId>,
        excludedCryptoIds?: Set<CryptoId>,
    ) => TradingCryptoSelectOptionProps[];
    buildDefaultCryptoOption: (cryptoId: CryptoId | undefined) => TradingCryptoSelectItemProps;
}

export type TradingOption = { value: string; label: string };

export type TradingBuyFormProps = {
    fiatInput?: string;
    cryptoInput?: string;
    currencySelect: TradingOption;
    cryptoSelect: TradingCryptoSelectItemProps;
    countrySelect: TradingOption;
    paymentMethod?: TradingPaymentMethodListProps;
    amountInCrypto: boolean;
};

export interface TradingAccountOptionsGroupOptionProps {
    value: CryptoId;
    label: string; // token shortcut
    cryptoName: string | undefined; // full name
    balance: string;
    descriptor: string;
    decimals: number;
    contractAddress?: string;
    accountType?: AccountType;
}

export type TradingOTC = {
    idWidget: string;
    idOtcUser: string;
    apiUrl: string;
    minimumFiat: string;
    allowedCurrencies: FiatCurrencyCode[];
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

export interface TradingExchangeFormProps extends FormState {
    [constants.TRADING_FORM_RECEIVE_CRYPTO_CURRENCY_SELECT]: TradingCryptoSelectItemProps | null;
    [constants.TRADING_FORM_SEND_CRYPTO_CURRENCY_SELECT]:
        | TradingAccountOptionsGroupOptionProps
        | undefined;
    [constants.TRADING_FORM_AMOUNT_IN_CRYPTO]: boolean;
    [constants.TRADING_EXCHANGE_RATE]: TradingExchangeRateType;
    [constants.TRADING_EXCHANGE_FORM]: TradingExchangeFormType;
    [constants.TRADING_EXCHANGE_COMPARATOR_KYC_FILTER]: TradingExchangeKycFilter;
    [constants.TRADING_EXCHANGE_COMPARATOR_RATE_FILTER]: TradingExchangeRateFilter;
}

export type TradingExchangeStepType =
    | 'RECEIVING_ADDRESS'
    | 'SEND_TRANSACTION'
    | 'SEND_APPROVAL_TRANSACTION'
    | 'SIGN_DATA';

export type TradingSendRejectedProps = {
    type: 'error' | 'sign-tx-error';
    error: {
        id: ExtendedMessageDescriptor['id'];
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
};

export type TradingSellStepType = 'BANK_ACCOUNT' | 'SEND_TRANSACTION';

export interface TradingSellFormProps extends FormState {
    sendCryptoSelect: TradingAccountOptionsGroupOptionProps | undefined;
    paymentMethod?: TradingPaymentMethodListProps;
    countrySelect: TradingOption;
    amountInCrypto: boolean;
}

export type TradingSellUserConsentProps = {
    provider: string;
    cryptoCurrency: CryptoId;
};
