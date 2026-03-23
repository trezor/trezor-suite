import {
    type BuyTrade,
    type CryptoId,
    type ExchangeProviderInfo,
    type FiatCurrencyCode,
    type SellFiatTrade,
} from 'invity-api';

import { type ExtendedMessageDescriptor } from '@suite/intl';
import type {
    TradingBuyInfoSelector,
    TradingBuyType,
    TradingExchangeInfoSelector,
    TradingExchangeType,
    TradingPaymentMethodType,
    TradingProviderInfo,
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
import { type Account } from '@suite-common/wallet-types';
import { type AssetLogoProps, type AssetOptionBaseProps } from '@trezor/product-components';

export type TradingPageType = 'form' | 'offers' | 'confirm' | 'retry';

export type UseTradingFormCommonProps = {
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
    trading: TradingStateSelector;
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

export type TradingCoinLogoProps = {
    cryptoId: CryptoId;
    className?: string;
    size?: AssetLogoProps['size'];
} & Pick<AssetLogoProps, 'showNetworkIcon' | 'margin'>;

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
          [name: string]: TradingProviderInfo;
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
    networkFee?: string | undefined;
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
