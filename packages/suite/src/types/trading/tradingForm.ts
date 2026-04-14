import type React from 'react';
import type { FieldPath, UseFormReturn } from 'react-hook-form';

import type {
    BankAccount,
    BuyTrade,
    BuyTradeQuoteRequest,
    CryptoId,
    ExchangeTrade,
    ExchangeTradeQuoteRequest,
    FiatCurrencyCode,
    SellFiatTrade,
    SellFiatTradeQuoteRequest,
} from 'invity-api';

import type { TranslationKey } from '@suite/intl';
import type {
    TRADING_FORM_CRYPTO_CURRENCY_SELECT,
    TRADING_FORM_CRYPTO_INPUT,
    TRADING_FORM_FIAT_INPUT,
    TRADING_FORM_OUTPUT_AMOUNT,
    TRADING_FORM_OUTPUT_FIAT,
    TRADING_FORM_SEND_CRYPTO_CURRENCY_SELECT,
    TradingAssetSellOption,
    TradingBuyFormProps,
    TradingBuyInfoSelector,
    TradingBuyType,
    TradingComposedTransactionInfo,
    TradingCountryOption,
    TradingCountrySubdivisionOption,
    TradingExchangeFormProps,
    TradingExchangeInfoSelector,
    TradingExchangeType,
    TradingFiatCurrencyOption,
    TradingPaymentMethodListProps,
    TradingPaymentMethodType,
    TradingSellFormProps,
    TradingSellInfoSelector,
    TradingSellType,
    TradingTradeType,
    TradingTransactionBuy,
    TradingTransactionExchange,
    TradingTransactionSell,
    TradingType,
    TradingVerifiedAddress,
} from '@suite-common/trading';
import { type Network } from '@suite-common/wallet-config';
import { type AccountsState } from '@suite-common/wallet-core';
import {
    type FeeInfo,
    type PrecomposedLevels,
    type PrecomposedLevelsCardano,
} from '@suite-common/wallet-types';
import { type FeeLevel } from '@trezor/connect';

import { type useTradingReceiveAddress } from 'src/hooks/wallet/trading/form/useTradingReceiveAddress';
import { type AppState } from 'src/reducers/store';
import { type Dispatch, type GetState, type TrezorDevice } from 'src/types/suite';
import {
    type TradingGetCryptoQuoteAmountProps,
    type TradingGetProvidersInfoProps,
    type TradingPageType,
    type TradingTradeSellExchangeType,
} from 'src/types/trading/trading';
import type { Account } from 'src/types/wallet';
import { type SendContextValues } from 'src/types/wallet/sendForm';
import { type AmountLimitProps, type CryptoAmountLimitProps } from 'src/utils/suite/validation';

export interface TradingBuyFormDefaultValuesProps {
    defaultValues: TradingBuyFormProps;
    defaultCountry: TradingCountryOption;
    defaultCurrency: TradingFiatCurrencyOption;
    defaultPaymentMethod: TradingPaymentMethodListProps;
    suggestedFiatCurrency: FiatCurrencyCode;
    defaultSubdivision: TradingCountrySubdivisionOption | undefined;
}

export type TradingBuySellFormProps = TradingBuyFormProps | TradingSellFormProps;
export type TradingSellExchangeFormProps = TradingSellFormProps | TradingExchangeFormProps;
export type TradingAllFormProps =
    | TradingBuyFormProps
    | TradingSellFormProps
    | TradingExchangeFormProps;

export interface TradingSellFormDefaultValuesProps {
    defaultValues: TradingSellFormProps;
    defaultCountry: TradingCountryOption;
    defaultCurrency: TradingFiatCurrencyOption;
    defaultPaymentMethod: TradingPaymentMethodListProps;
    defaultSubdivision: TradingCountrySubdivisionOption | undefined;
}

export interface TradingExchangeFormDefaultValuesProps {
    defaultValues: TradingExchangeFormProps;
    defaultCurrency: TradingFiatCurrencyOption;
}

interface TradingFormStateProps {
    isFormLoading: boolean;
    isFormInvalid: boolean;
    isLoadingOrInvalid: boolean;

    toggleAmountInCrypto: () => void;
}

interface TradingCommonFormProps {
    device: TrezorDevice | undefined;
    account: Account;
    network: Network;

    goToOffers: () => Promise<void>;
}

interface TradingCommonFormBuySellProps {
    defaultCountry: TradingCountryOption;
    defaultSubdivision: TradingCountrySubdivisionOption | undefined;
    defaultCurrency: TradingFiatCurrencyOption;
    defaultPaymentMethod: TradingPaymentMethodListProps;
    paymentMethods: TradingPaymentMethodListProps[];
    amountLimits?: AmountLimitProps;
}

type TradingVerifyAccountProps = (
    account: Account,
    address?: string,
    path?: string,
) => (dispatch: Dispatch, getState: GetState) => Promise<void>;

export type TradingBuyConfirmTradeProps = {
    trade?: BuyTrade;
    receiveAddress: string;
};

export interface TradingBuyFormContextProps
    extends
        UseFormReturn<TradingBuyFormProps>,
        TradingCommonFormProps,
        TradingCommonFormBuySellProps {
    type: TradingBuyType;
    buyInfo?: TradingBuyInfoSelector;
    cryptoInputValue?: string;
    quotesRequest: BuyTradeQuoteRequest | undefined;
    quotes: BuyTrade[];
    selectedQuote: BuyTrade | undefined;
    preselectedQuote: BuyTrade | undefined;
    trade?: TradingTransactionBuy;
    verifiedAddress: TradingVerifiedAddress;
    // form - additional helpers for form
    form: {
        state: TradingFormStateProps;
    };
    tradingReceiveAddress: ReturnType<typeof useTradingReceiveAddress>;
    isAmountEmpty: boolean;

    selectQuote: (quote: BuyTrade) => Promise<void>;
    confirmTrade: ({
        receiveAddress,
    }: TradingBuyConfirmTradeProps) => Promise<BuyTrade | undefined>;
    verifyAddress: TradingVerifyAccountProps;
    removeDraft: (key: string) => void;
    setAmountLimits: (limits?: AmountLimitProps) => void;
    methods: UseFormReturn<TradingBuyFormProps>;
    clearQuotesAndParams: () => void;
}

export interface TradingSellFormContextProps
    extends
        UseFormReturn<TradingSellFormProps>,
        TradingCommonFormProps,
        TradingCommonFormBuySellProps {
    type: TradingSellType;
    isComposing: boolean;
    sellInfo?: TradingSellInfoSelector;
    localCurrencyOption: { label: string; value: string };
    composedLevels?: PrecomposedLevels | PrecomposedLevelsCardano;
    composedTransactionInfo: TradingComposedTransactionInfo;
    quotesRequest: SellFiatTradeQuoteRequest | undefined;
    feeInfo: FeeInfo;
    quotes: SellFiatTrade[];
    selectedQuote?: SellFiatTrade;
    preselectedQuote: SellFiatTrade | undefined;
    trade?: TradingTransactionSell;
    suiteReceiveAccounts?: AppState['wallet']['accounts'];
    // form - additional helpers for form
    form: {
        state: TradingFormStateProps;
        helpers: TradingUseFormActionsReturnProps;
    };
    isAmountEmpty: boolean;
    shouldSendInSats: boolean | undefined;
    changeFeeLevel: (level: FeeLevel['label']) => void;
    composeRequest: SendContextValues<TradingSellExchangeFormProps>['composeTransaction'];
    setAmountLimits: (limits?: AmountLimitProps) => void;

    addBankAccount: () => void;
    confirmTrade: (bankAccount: BankAccount) => void;
    sendTransaction: () => Promise<boolean>;
    selectQuote: (quote: SellFiatTrade) => void;
    methods: UseFormReturn<TradingSellFormProps>;
    showReserveBanner: boolean;
    setShowReserveBanner: (showReserveBanner: boolean) => void;
    clearQuotesAndParams: () => void;
}

export type TradingExchangeConfirmTradeProps = {
    receiveAddress: string;
    extraField?: string;
    trade?: ExchangeTrade;
    approvalFlow?: boolean;
};

export interface TradingExchangeFormContextProps
    extends UseFormReturn<TradingExchangeFormProps>, TradingCommonFormProps {
    type: TradingExchangeType;
    // form - additional helpers for form
    form: {
        state: TradingFormStateProps;
        helpers: TradingUseFormActionsReturnProps;
    };

    selectedQuote?: ExchangeTrade;
    preselectedQuote?: ExchangeTrade;
    trade?: TradingTransactionExchange;
    suiteReceiveAccounts?: AccountsState;
    feeInfo: FeeInfo;

    exchangeInfo?: TradingExchangeInfoSelector;
    defaultCurrency: TradingFiatCurrencyOption;
    amountLimits?: CryptoAmountLimitProps;
    composedLevels?: PrecomposedLevels | PrecomposedLevelsCardano;
    composedTransactionInfo: TradingComposedTransactionInfo;
    quotes: ExchangeTrade[];
    cexQuotes: ExchangeTrade[];
    dexQuotes: ExchangeTrade[];
    quotesRequest: ExchangeTradeQuoteRequest | undefined;
    receiveAccount?: Account;
    verifiedAddress: TradingVerifiedAddress;
    shouldSendInSats: boolean | undefined;
    isAmountEmpty: boolean;
    setReceiveAccount: (account?: Account) => void;
    setAmountLimits: (limits?: CryptoAmountLimitProps) => void;
    composeRequest: SendContextValues<TradingSellExchangeFormProps>['composeTransaction'];
    changeFeeLevel: (level: FeeLevel['label']) => void;

    confirmTrade: ({
        receiveAddress,
        extraField,
        trade,
    }: TradingExchangeConfirmTradeProps) => Promise<ExchangeTrade | undefined>;
    sendTransaction: () => Promise<boolean>;
    signDataAndConfirm: () => Promise<void>;
    selectQuote: (quote: ExchangeTrade) => void;
    verifyAddress: TradingVerifyAccountProps;
    approveTransaction: (trade: ExchangeTrade) => Promise<boolean>;
    revokeApproval: (trade: ExchangeTrade) => Promise<boolean>;
    confirmApproval: ({
        trade,
        receiveAddress,
    }: {
        trade?: ExchangeTrade;
        receiveAddress: string;
    }) => Promise<ExchangeTrade | undefined>;
    watchApproval: ({ refreshCount }: { refreshCount: number }) => Promise<void>;
    refreshQuotes: () => Promise<void>;
    isScheduledQuotesRefresh: boolean;
    resetSelectedOffer: () => void;
    fetchFeesAndCompose: () => Promise<void>;
    tradingReceiveAddress: ReturnType<typeof useTradingReceiveAddress>;

    isLoadingQuote: boolean;
    setIsLoadingQuote: (isLoadingQuote: boolean) => void;
    isApproval: boolean;
    setIsApproval: (isApproval: boolean) => void;
    methods: UseFormReturn<TradingExchangeFormProps>;

    showReserveBanner: boolean;
    setShowReserveBanner: (showReserveBanner: boolean) => void;
}

export type TradingExchangeApprovalType = 'APPROVE' | 'REVOKE';

export type TradingFormMapProps = {
    buy: TradingBuyFormContextProps;
    sell: TradingSellFormContextProps;
    exchange: TradingExchangeFormContextProps;
};

export type TradingFormContextValues<T extends TradingType> = TradingFormMapProps[T];

export interface TradingFormInputDefaultProps {
    label?: TranslationKey;
    placeholder?: TranslationKey;
    'data-testid'?: string;
}

export interface TradingFormInputCryptoSelectProps<
    TFieldValues extends TradingAllFormProps,
> extends TradingFormInputDefaultProps {
    cryptoSelectName: FieldPath<TFieldValues>;
    supportedCryptoCurrencies: Set<CryptoId> | undefined;
    methods: UseFormReturn<TFieldValues>;
    isDisabled?: boolean;
    sortTokensByFiatBalanceInDesc?: boolean;
}

export interface TradingFormInputFiatCryptoProps {
    cryptoInputName: typeof TRADING_FORM_CRYPTO_INPUT | typeof TRADING_FORM_OUTPUT_AMOUNT;
    fiatInputName: typeof TRADING_FORM_FIAT_INPUT | typeof TRADING_FORM_OUTPUT_FIAT;
    cryptoSelectName:
        | typeof TRADING_FORM_CRYPTO_CURRENCY_SELECT
        | typeof TRADING_FORM_SEND_CRYPTO_CURRENCY_SELECT;
    labelLeft?: React.ReactNode;
    labelRight?: React.ReactNode;
}

export interface TradingFormInputFiatCryptoWrapProps {
    showLabel?: boolean;
    cryptoInputName: typeof TRADING_FORM_CRYPTO_INPUT | typeof TRADING_FORM_OUTPUT_AMOUNT;
    fiatInputName: typeof TRADING_FORM_FIAT_INPUT | typeof TRADING_FORM_OUTPUT_FIAT;
    cryptoSelectName:
        | typeof TRADING_FORM_CRYPTO_CURRENCY_SELECT
        | typeof TRADING_FORM_SEND_CRYPTO_CURRENCY_SELECT;
    cryptoCurrencyLabel?: CryptoId;
    currencySelectLabel?: string;
}

export interface TradingFormInputCurrencyProps {
    width?: number;
    isClean?: boolean;
}

export interface TradingUseFormActionsProps<T extends TradingSellExchangeFormProps> {
    account: Account;
    methods: UseFormReturn<T>;
    pageType: TradingPageType;
    draftUpdated?: TradingSellExchangeFormProps | null;
    type: TradingTradeSellExchangeType;
    handleChange: (offLoading?: boolean) => Promise<void>;
    setAmountLimits: (limits?: AmountLimitProps) => void;
    changeFeeLevel: (level: FeeLevel['label']) => void;
    composeRequest: SendContextValues<TradingSellExchangeFormProps>['composeTransaction'];
    setAccountOnChange: (account: Account) => void;
    setComposedLevels: (levels: PrecomposedLevels | PrecomposedLevelsCardano | undefined) => void;
    composedLevels: PrecomposedLevels | PrecomposedLevelsCardano | undefined;
    composedTransactionInfo: TradingComposedTransactionInfo;
    setShowReserveBanner: (showReserveBanner: boolean) => void;
}

export interface TradingUseFormActionsReturnProps {
    isBalanceZero: boolean;

    onCryptoCurrencyChange: (selected: TradingAssetSellOption) => Promise<void>;
    onFiatCurrencyChange: (value: FiatCurrencyCode) => void;
    setRatioAmount: (divisor: number) => void;
    setAllAmount: () => void;

    fractionButton?: number;
    setFractionButton: (value?: number) => void;
}

export interface TradingUseComposeTransactionProps<T extends TradingSellExchangeFormProps> {
    type: TradingTradeSellExchangeType;
    account: Account;
    network: Network;
    methods: UseFormReturn<T>;
    values: T;
    setShowReserveBanner: (showReserveBanner: boolean) => void;
}

export interface TradingUseComposeTransactionStateProps {
    account: Account;
    network: Network;
    feeInfo: FeeInfo;
}

export interface TradingUseComposeTransactionReturnProps extends TradingUseComposeTransactionStateProps {
    isComposing: boolean;
    composedLevels: PrecomposedLevels | PrecomposedLevelsCardano | undefined;
    feeInfo: FeeInfo;
    changeFeeLevel: (level: FeeLevel['label']) => void;
    composeRequest: SendContextValues<TradingSellExchangeFormProps>['composeTransaction'];
    setComposedLevels: (levels: PrecomposedLevels | PrecomposedLevelsCardano | undefined) => void;
}

export interface TradingOfferCommonProps {
    account?: Account;
    selectedQuote: TradingTradeType;
    providers: TradingGetProvidersInfoProps;
    type: TradingType;
    quoteAmounts: TradingGetCryptoQuoteAmountProps | null;
    paymentMethod?: TradingPaymentMethodType;
    paymentMethodName?: string;
}

export interface TradingOfferBuyProps extends TradingOfferCommonProps {
    selectedQuote: BuyTrade;
}

export interface TradingOfferSellProps extends TradingOfferCommonProps {
    selectedQuote: SellFiatTrade;
}

export interface TradingOfferExchangeProps extends Omit<
    TradingOfferCommonProps,
    'paymentMethod' | 'paymentMethodName'
> {
    selectedQuote: ExchangeTrade;
}

export interface TradingSelectedOfferInfoProps extends TradingOfferCommonProps {
    selectedAccount?: Account;
    transactionId?: string;
}
