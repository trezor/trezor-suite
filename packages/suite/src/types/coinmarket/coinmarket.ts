import type { BuyInfo } from 'src/actions/wallet/coinmarketBuyActions';
import type { ExchangeInfo } from 'src/actions/wallet/coinmarketExchangeActions';
import type { SellInfo } from 'src/actions/wallet/coinmarketSellActions';
import type {
    Option,
    Trade,
    TradeBuy,
    TradeExchange,
    TradeSell,
    TradeType,
} from 'src/types/wallet/coinmarketCommonTypes';
import {
    BuyCryptoPaymentMethod,
    BuyTrade,
    BuyTradeStatus,
    CryptoSymbol,
    CryptoSymbolInfo,
    ExchangeTrade,
    ExchangeTradeStatus,
    FiatCurrencyCode,
    SavingsTradeItemStatus,
    SellFiatTrade,
    SellTradeStatus,
    WatchBuyTradeResponse,
    WatchExchangeTradeResponse,
    WatchSellTradeResponse,
} from 'invity-api';
import { Account } from '@suite-common/wallet-types';
import { AnyAction, Dispatch } from 'redux';
import { State } from 'src/reducers/wallet/coinmarketReducer';
import { WithSelectedAccountLoadedProps } from 'src/components/wallet';
import {
    CryptoCategoryA,
    CryptoCategoryB,
    CryptoCategoryC,
    CryptoCategoryD,
    CryptoCategoryE,
} from 'src/constants/wallet/coinmarket/cryptoCategories';
import { NetworkSymbol } from '@suite-common/wallet-config';
import { ExtendedMessageDescriptor, TrezorDevice } from 'src/types/suite';
import { Timer } from '@trezor/react-utils';
import { AccountsState } from '@suite-common/wallet-core';

export type UseCoinmarketProps = WithSelectedAccountLoadedProps;
export type UseCoinmarketCommonProps = UseCoinmarketProps & {
    type: CoinmarketTradeType;
};
export interface UseCoinmarketCommonReturnProps<T extends CoinmarketTradeType> {
    callInProgress: boolean;
    account: Account;
    selectedQuote: CoinmarketTradeDetailMapProps[T] | undefined;
    timer: Timer;
    device: TrezorDevice | undefined;
    setCallInProgress: (state: boolean) => void;
    setSelectedQuote: (quote: CoinmarketTradeDetailMapProps[T] | undefined) => void;
    checkQuotesTimer: (callback: () => Promise<void>) => void;
}
export type UseCoinmarketFormProps = UseCoinmarketProps & {
    offFirstRequest?: boolean;
};

export type CoinmarketTradeBuyType = 'buy';
export type CoinmarketTradeSellType = 'sell';
export type CoinmarketTradeExchangeType = 'exchange';
export type CoinmarketTradeType =
    | CoinmarketTradeBuyType
    | CoinmarketTradeSellType
    | CoinmarketTradeExchangeType;
export type CoinmarketTradeBuySellType = Exclude<CoinmarketTradeType, CoinmarketTradeExchangeType>;

export type CoinmarketTradeMapProps = {
    buy: TradeBuy;
    sell: TradeSell;
    exchange: TradeExchange;
};

export type CoinmarketTradeDetailType = BuyTrade | SellFiatTrade | ExchangeTrade;
export type CoinmarketTradeDetailMapProps = {
    buy: BuyTrade;
    sell: SellFiatTrade;
    exchange: ExchangeTrade;
};
export type CoinmarketTradeBuySellDetailMapProps = Omit<CoinmarketTradeDetailMapProps, 'exchange'>;

export type CoinmarketTradeInfoMapProps = {
    buy: BuyInfo;
    sell: SellInfo;
    exchange: ExchangeInfo;
};

export type CoinmarketWatchTradeResponseMapProps = {
    buy: WatchBuyTradeResponse;
    sell: WatchSellTradeResponse;
    exchange: WatchExchangeTradeResponse;
};

export interface CoinmarketGetTypedTradeProps {
    trades: Trade[];
    tradeType: CoinmarketTradeType;
    transactionId: string | undefined;
}

export type CoinmarketTradeStatusType =
    | BuyTradeStatus
    | SellTradeStatus
    | ExchangeTradeStatus
    | SavingsTradeItemStatus;

export interface CoinmarketGetDetailDataProps {
    coinmarket: State;
    tradeType: TradeType;
}

export interface CoinmarketGetTypedInfoTradeProps {
    coinmarket: State;
    tradeType: CoinmarketTradeType;
}

export interface CoinmarketUseWatchTradeProps<T extends CoinmarketTradeType> {
    account: Account | undefined;
    trade: CoinmarketTradeMapProps[T] | undefined;
}

export interface CoinmarketWatchTradeProps<T extends CoinmarketTradeType> {
    trade: CoinmarketTradeMapProps[T];
    account: Account;
    refreshCount: number;
    dispatch: Dispatch<AnyAction>;
    removeDraft: (key: string) => void;
}

export type CoinmarketPaymentMethodProps = BuyCryptoPaymentMethod | '';

export interface CoinmarketPaymentMethodListProps extends Option {
    value: CoinmarketPaymentMethodProps;
    label: string;
}

export type CryptoCategoryType =
    | typeof CryptoCategoryA
    | typeof CryptoCategoryB
    | typeof CryptoCategoryC
    | typeof CryptoCategoryD
    | typeof CryptoCategoryE;

export type CryptoCategoriesProps = {
    [key in CryptoCategoryType]?: {
        translationId: Extract<
            ExtendedMessageDescriptor['id'],
            `TR_COINMARKET_CRYPTO_CATEGORY_${string}`
        >;
        network?: NetworkSymbol;
    };
};

export interface CoinmarketCryptoListProps {
    value: CryptoSymbol;
    label: string; // token shortcut
    cryptoName: string | null; // full name
}

export type CoinmarketUtilsProvidersProps = {
    [name: string]: {
        logo: string;
        companyName: string;
        brandName?: string;
    };
};

export interface CoinmarketBuildOptionsProps {
    symbolsInfo: CryptoSymbolInfo[] | undefined;
    cryptoCurrencies: Set<CryptoSymbol>;
}

export interface CoinmarketOptionsGroupProps {
    label: CryptoCategoryType;
    options: CoinmarketCryptoListProps[];
}

export interface CoinmarketGetSortedAccountsProps {
    accounts: AccountsState;
    deviceState: string | undefined;
}

export interface CoinmarketBuildAccountOptionsProps extends CoinmarketGetSortedAccountsProps {
    symbolsInfo: CryptoSymbolInfo[] | undefined;
    accountLabels: Record<string, string | undefined>;
    defaultAccountLabelString: ({
        accountType,
        symbol,
        index,
    }: {
        accountType: Account['accountType'];
        symbol: Account['symbol'];
        index?: number;
    }) => string;
}

export interface CoinmarketAccountOptionsGroupOptionProps extends CoinmarketCryptoListProps {
    balance: string;
    descriptor: string;
    contractAddress?: string;
}

export interface CoinmarketAccountsOptionsGroupProps {
    label: string;
    options: CoinmarketAccountOptionsGroupOptionProps[];
}

export type CoinmarketFiatCurrenciesProps = Map<FiatCurrencyCode, string>;

export interface CoinmarketGetAmountLabelsProps {
    type: CoinmarketTradeType;
    amountInCrypto: boolean;
}

type CoinmarketPayGetLabelType = Extract<
    ExtendedMessageDescriptor['id'],
    `TR_COINMARKET_YOU_${'PAY' | 'GET'}`
>;

export interface CoinmarketGetAmountLabelsReturnProps {
    label1: CoinmarketPayGetLabelType;
    label2: CoinmarketPayGetLabelType;
    labelComparatorOffer: Extract<
        ExtendedMessageDescriptor['id'],
        `TR_COINMARKET_YOU_WILL_${'PAY' | 'GET'}`
    >;
}
