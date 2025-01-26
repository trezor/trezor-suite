import {
    BuyCryptoPaymentMethod,
    BuyProviderInfo,
    BuyTrade,
    BuyTradeStatus,
    CryptoId,
    ExchangeProviderInfo,
    ExchangeTrade,
    ExchangeTradeStatus,
    FiatCurrencyCode,
    SellFiatTrade,
    SellProviderInfo,
    SellTradeStatus,
} from 'invity-api';
import { AnyAction, Dispatch } from 'redux';

import { Account, SelectedAccountLoaded } from '@suite-common/wallet-types';
import { AccountType, NetworkSymbolExtended } from '@suite-common/wallet-config';
import { Timer } from '@trezor/react-utils';
import { AccountsState } from '@suite-common/wallet-core';
import { TokenDefinitionsState } from '@suite-common/token-definitions';
import { AssetLogoProps } from '@trezor/components';
import { StaticSessionId } from '@trezor/connect';
import { AssetOptionBaseProps } from '@trezor/product-components';
import type {
    TradingBuyType,
    TradingExchangeType,
    TradingPaymentMethodType,
    TradingSellType,
    TradingType,
} from '@suite-common/invity';

import { GetDefaultAccountLabelParams } from 'src/hooks/suite/useDefaultAccountLabel';
import { State } from 'src/reducers/wallet/tradingReducer';
import { ExtendedMessageDescriptor, TrezorDevice } from 'src/types/suite';
import type {
    Option,
    Trade,
    TradeBuy,
    TradeExchange,
    TradeSell,
    TradeType,
} from 'src/types/wallet/tradingCommonTypes';
import type { SellInfo } from 'src/actions/wallet/tradingSellActions';
import type { ExchangeInfo } from 'src/actions/wallet/tradingExchangeActions';
import type { BuyInfo } from 'src/actions/wallet/tradingBuyActions';

type TradingPageType = 'form' | 'offers' | 'confirm';

export type UseTradingProps = { selectedAccount: SelectedAccountLoaded };
export type UseTradingCommonProps = UseTradingProps & {
    pageType: TradingPageType;
};
export interface UseTradingCommonReturnProps {
    callInProgress: boolean;
    account: Account;
    timer: Timer;
    device: TrezorDevice | undefined;
    setCallInProgress: (state: boolean) => void;
    checkQuotesTimer: (callback: () => Promise<void>) => void;
}
export type UseTradingFormProps = UseTradingProps & {
    /**
     * Difference between form and offers is that on the offers page are used all data filled in the form
     * but on the form page we prefill form with only some data from draft
     *
     * default value is 'form'
     */
    pageType?: TradingPageType;
};

export type TradingTradeBuySellType = Exclude<TradingType, TradingExchangeType>;
export type TradingTradeSellExchangeType = Exclude<TradingType, TradingBuyType>;
export type TradingTradeBuyExchangeType = Exclude<TradingType, TradingSellType>;

export type TradingTradeMapProps = {
    buy: TradeBuy;
    sell: TradeSell;
    exchange: TradeExchange;
};

export type TradingTradeDetailBuySellType = BuyTrade | SellFiatTrade;

export type TradingTradeDetailMapProps = {
    buy: BuyTrade;
    sell: SellFiatTrade;
    exchange: ExchangeTrade;
};
export type TradingTradeBuySellDetailMapProps = Omit<TradingTradeDetailMapProps, 'exchange'>;

export type TradingTradeInfoMapProps = {
    buy: BuyInfo;
    sell: SellInfo;
    exchange: ExchangeInfo;
};

export interface TradingGetTypedTradeProps {
    trades: Trade[];
    tradeType: TradingType;
    transactionId: string | undefined;
}

export type TradingTradeStatusType = BuyTradeStatus | SellTradeStatus | ExchangeTradeStatus;

export interface TradingGetDetailDataProps {
    trading: State;
    tradeType: TradeType;
}

export interface TradingGetTypedInfoTradeProps {
    trading: State;
    tradeType: TradingType;
}

export interface TradingUseWatchTradeProps<T extends TradingType> {
    account: Account | undefined;
    trade: TradingTradeMapProps[T] | undefined;
}

export interface TradingWatchTradeProps<T extends TradingType> {
    trade: TradingTradeMapProps[T];
    account: Account;
    refreshCount: number;
    dispatch: Dispatch<AnyAction>;
    removeDraft: (key: string) => void;
}

export type TradingPaymentMethodProps = BuyCryptoPaymentMethod | '';

export interface TradingPaymentMethodListProps extends Option {
    value: TradingPaymentMethodProps;
    label: string;
}

export interface TradingCryptoListProps {
    value: CryptoId;
    label: string; // token shortcut
    cryptoName?: string | undefined; // full name
}

export type TradingUtilsProvidersProps = {
    [name: string]: {
        logo: string;
        companyName: string;
        brandName?: string;
    };
};

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

export interface TradingCoinLogoProps {
    cryptoId: CryptoId;
    size?: 20 | 24;
    margin?: AssetLogoProps['margin'];
    className?: string;
}

export interface TradingCryptoSelectItemProps
    extends Omit<SelectAssetOptionCurrencyProps, 'value' | 'ticker'> {
    value: CryptoId;
    label: string;
    ticker?: string;
}
export interface TradingCryptoSelectGroupProps extends SelectAssetOptionGroupProps {}
export type TradingCryptoSelectOptionProps =
    | TradingCryptoSelectItemProps
    | SelectAssetOptionGroupProps;

export interface TradingGetSortedAccountsProps {
    accounts: AccountsState;
    deviceState: StaticSessionId | undefined;
}

export interface TradingBuildAccountOptionsProps extends TradingGetSortedAccountsProps {
    accountLabels: Record<string, string | undefined>;
    getDefaultAccountLabel: ({
        accountType,
        symbol,
        index,
    }: GetDefaultAccountLabelParams) => string;
    supportedCryptoIds: Set<CryptoId> | undefined;
    tokenDefinitions: Partial<TokenDefinitionsState>;
}

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

export interface TradingAccountsOptionsGroupProps {
    label: string;
    options: TradingAccountOptionsGroupOptionProps[];
}

export type TradingFiatCurrenciesProps = Map<FiatCurrencyCode, string>;

export interface TradingGetAmountLabelsProps {
    type: TradingType;
    amountInCrypto: boolean;
}

export type TradingPayGetLabelType =
    | Extract<ExtendedMessageDescriptor['id'], `TR_TRADING_YOU_${'PAY' | 'GET' | 'RECEIVE'}`>
    | 'TR_TRADING_SWAP'
    | 'TR_TRADING_SWAP_AMOUNT';

export interface TradingGetAmountLabelsReturnProps {
    inputLabel: TradingPayGetLabelType;
    offerLabel: TradingPayGetLabelType;
    labelComparatorOffer: Extract<
        ExtendedMessageDescriptor['id'],
        `TR_TRADING_YOU_WILL_${'PAY' | 'GET'}`
    >;
    sendLabel: TradingPayGetLabelType;
    receiveLabel: TradingPayGetLabelType;
}

export type TradingGetProvidersInfoProps =
    | {
          [name: string]: BuyProviderInfo | SellProviderInfo | ExchangeProviderInfo;
      }
    | undefined;

export type TradingExchangeProvidersInfoProps = {
    [key: string]: ExchangeProviderInfo;
};

export interface TradingGetFiatCurrenciesProps {
    supportedFiatCurrencies: Set<string> | undefined;
    defaultAmountsOfFiatCurrencies?: Map<FiatCurrencyCode, string>;
}

export interface TradingGetCryptoQuoteAmountProps {
    amountInCrypto?: boolean | undefined;
    sendAmount: string;
    sendCurrency: CryptoId | string | undefined;
    receiveAmount: string;
    receiveCurrency: CryptoId | undefined;
}

export interface TradingGetPaymentMethodProps {
    paymentMethod?: TradingPaymentMethodType;
    paymentMethodName?: string;
}

export interface TradingCryptoAmountProps {
    amountInCrypto?: boolean | undefined;
    sendAmount: string | number | undefined;
    sendCurrency: CryptoId | string | undefined;
    receiveAmount: string | number | undefined;
    receiveCurrency: CryptoId | undefined;
    className?: string;
}

export interface SelectAssetOptionCurrencyProps extends AssetOptionBaseProps {
    type: 'currency';
    label?: string;
    balance?: string;
    networkName?: string;
}

export interface SelectAssetOptionGroupProps {
    type: 'group';
    label: string;
    networkName?: string;
    coingeckoId?: string;
}

export type SelectAssetOptionProps = SelectAssetOptionCurrencyProps | SelectAssetOptionGroupProps;
