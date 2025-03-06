import { ReactNode } from 'react';

import type {
    BuyCryptoPaymentMethod,
    BuyTrade,
    BuyTradeStatus,
    CryptoId,
    ExchangeTrade,
    ExchangeTradeStatus,
    FiatCurrencyCode,
    SellCryptoPaymentMethod,
    SellFiatTrade,
    SellTradeStatus,
    WatchBuyTradeResponse,
    WatchExchangeTradeResponse,
    WatchSellTradeResponse,
} from 'invity-api';

import { AccountType, NetworkSymbolExtended } from '@suite-common/wallet-config';
import type { Account } from '@suite-common/wallet-types';

export type InvityServerEnvironment = 'production' | 'staging' | 'dev' | 'localhost';
export type InvityServers = Record<InvityServerEnvironment, string>;

export type TradingBuyType = 'buy';
export type TradingSellType = 'sell';
export type TradingExchangeType = 'exchange';
export type TradingType = TradingBuyType | TradingSellType | TradingExchangeType;

export type TradingTradeBuySellType = Exclude<TradingType, TradingExchangeType>;

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
export type TradingTransactionBuy = TradingCommonTransaction & { tradeType: 'buy'; data: BuyTrade };
export type TradingTransactionSell = TradingCommonTransaction & {
    tradeType: 'sell';
    data: SellFiatTrade;
};
export type TradingTransactionExchange = TradingCommonTransaction & {
    tradeType: 'exchange';
    data: ExchangeTrade;
};
export type TradingTransaction =
    | TradingTransactionBuy
    | TradingTransactionSell
    | TradingTransactionExchange;

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
