import {
    BuyProviderInfo,
    BuyTrade,
    CryptoId,
    ExchangeProviderInfo,
    FiatCurrencyCode,
    SellFiatTrade,
    SellProviderInfo,
} from 'invity-api';

import { TokenDefinitionsState } from '@suite-common/token-definitions';
import type {
    TradingBuyInfoSelector,
    TradingBuyType,
    TradingExchangeInfoSelector,
    TradingExchangeType,
    TradingPaymentMethodType,
    TradingSelectAssetOptionGroupProps,
    TradingSellInfoSelector,
    TradingSellType,
    TradingStateSelector,
    TradingTransaction,
    TradingTransactionBuy,
    TradingTransactionExchange,
    TradingTransactionSell,
    TradingType,
} from '@suite-common/trading';
import { AccountType } from '@suite-common/wallet-config';
import { AccountsState } from '@suite-common/wallet-core';
import { Account, SelectedAccountLoaded } from '@suite-common/wallet-types';
import { AssetLogoProps } from '@trezor/components';
import { StaticSessionId } from '@trezor/connect';
import { AssetOptionBaseProps } from '@trezor/product-components';
import { Timer } from '@trezor/react-utils';

import { GetDefaultAccountLabelParams } from 'src/hooks/suite/useDefaultAccountLabel';
import { ExtendedMessageDescriptor, TrezorDevice } from 'src/types/suite';

type TradingPageType = 'form' | 'offers' | 'confirm';

export type UseTradingProps = { selectedAccount: SelectedAccountLoaded };
export type UseTradingCommonProps = UseTradingProps & {
    pageType: TradingPageType;
    isLoading: boolean;
};
export interface UseTradingCommonReturnProps {
    account: Account;
    timer: Timer;
    device: TrezorDevice | undefined;
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
    buy: TradingTransactionBuy;
    sell: TradingTransactionSell;
    exchange: TradingTransactionExchange;
};

export type TradingTradeDetailBuySellType = BuyTrade | SellFiatTrade;

export type TradingTradeInfoMapProps = {
    buy: TradingBuyInfoSelector;
    sell: TradingSellInfoSelector;
    exchange: TradingExchangeInfoSelector;
};

export interface TradingGetTypedTradeProps {
    trades: TradingTransaction[];
    tradeType: TradingType;
    transactionId: string | undefined;
}

export interface TradingGetDetailDataProps {
    tradingNew: TradingStateSelector;
    tradeType: TradingType;
    infos: {
        buy: TradingBuyInfoSelector | undefined;
        sell: TradingSellInfoSelector | undefined;
        exchange: TradingExchangeInfoSelector | undefined;
    };
}

export interface TradingUseWatchTradeProps<T extends TradingType> {
    account: Account | undefined;
    trade: TradingTradeMapProps[T] | undefined;
}

export interface TradingCryptoListProps {
    value: CryptoId;
    label: string; // token shortcut
    cryptoName?: string | undefined; // full name
}

export interface TradingCoinLogoProps {
    cryptoId: CryptoId;
    size?: 20 | 24;
    margin?: AssetLogoProps['margin'];
    className?: string;
}

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
    supportedFiatCurrencies: Set<FiatCurrencyCode> | undefined;
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

export type SelectAssetOptionProps =
    | SelectAssetOptionCurrencyProps
    | TradingSelectAssetOptionGroupProps;
