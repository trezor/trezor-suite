import React from 'react';
import type { FieldPath, FieldValues, UseFormReturn } from 'react-hook-form';

import type {
    BankAccount,
    BuyTrade,
    BuyTradeQuoteRequest,
    CryptoId,
    ExchangeTrade,
    ExchangeTradeQuoteRequest,
    FiatCurrencyCode,
    SellFiatTrade,
} from 'invity-api';

import type {
    TradingBuyFormProps,
    TradingBuyInfoSelector,
    TradingBuyType,
    TradingCryptoSelectItemProps,
    TradingExchangeType,
    TradingPaymentMethodListProps,
    TradingPaymentMethodProps,
    TradingPaymentMethodType,
    TradingSellType,
    TradingTradeMapProps,
    TradingTradeType,
    TradingTransactionBuy,
    TradingTransactionExchange,
    TradingTransactionSell,
    TradingType,
} from '@suite-common/trading';
import { Network } from '@suite-common/wallet-config';
import { AccountsState } from '@suite-common/wallet-core';
import {
    FeeInfo,
    FormState,
    PrecomposedLevels,
    PrecomposedLevelsCardano,
} from '@suite-common/wallet-types';
import { FeeLevel } from '@trezor/connect';
import { Timer } from '@trezor/react-utils';

import { ExchangeInfo } from 'src/actions/wallet/tradingExchangeActions';
import { TradingSellInfoSelector } from 'src/actions/wallet/tradingSellActions';
import type { TranslationKey } from 'src/components/suite/Translation';
import {
    EXCHANGE_COMPARATOR_KYC_FILTER,
    EXCHANGE_COMPARATOR_KYC_FILTER_ALL,
    EXCHANGE_COMPARATOR_KYC_FILTER_NO_KYC,
    EXCHANGE_COMPARATOR_RATE_FILTER,
    EXCHANGE_COMPARATOR_RATE_FILTER_ALL,
    EXCHANGE_COMPARATOR_RATE_FILTER_DEX,
    EXCHANGE_COMPARATOR_RATE_FILTER_FIXED_CEX,
    EXCHANGE_COMPARATOR_RATE_FILTER_FLOATING_CEX,
    FORM_EXCHANGE_CEX,
    FORM_EXCHANGE_DEX,
    FORM_EXCHANGE_TYPE,
    FORM_RATE_FIXED,
    FORM_RATE_FLOATING,
    FORM_RATE_TYPE,
} from 'src/constants/wallet/trading/form';
import { AppState } from 'src/reducers/store';
import { Dispatch, GetState } from 'src/types/suite';
import {
    TradingAccountOptionsGroupOptionProps,
    TradingGetCryptoQuoteAmountProps,
    TradingGetProvidersInfoProps,
    TradingTradeSellExchangeType,
} from 'src/types/trading/trading';
import type { Account } from 'src/types/wallet';
import { SendContextValues } from 'src/types/wallet/sendForm';
import { Option } from 'src/types/wallet/tradingCommonTypes';
import { AmountLimitProps, CryptoAmountLimitProps } from 'src/utils/suite/validation';

export interface TradingBuyFormDefaultValuesProps {
    defaultValues: TradingBuyFormProps;
    defaultCountry: Option;
    defaultCurrency: Option;
    defaultPaymentMethod: TradingPaymentMethodListProps;
    suggestedFiatCurrency: FiatCurrencyCode;
}

export interface TradingSellFormProps extends FormState {
    sendCryptoSelect: TradingAccountOptionsGroupOptionProps | undefined;
    paymentMethod?: TradingPaymentMethodListProps;
    countrySelect: Option;
    amountInCrypto: boolean;
}

export type RateType = typeof FORM_RATE_FIXED | typeof FORM_RATE_FLOATING;
export type ExchangeType = typeof FORM_EXCHANGE_CEX | typeof FORM_EXCHANGE_DEX;

export type KycFilter =
    | typeof EXCHANGE_COMPARATOR_KYC_FILTER_ALL
    | typeof EXCHANGE_COMPARATOR_KYC_FILTER_NO_KYC;
export type RateTypeFilter =
    | typeof EXCHANGE_COMPARATOR_RATE_FILTER_ALL
    | typeof EXCHANGE_COMPARATOR_RATE_FILTER_FIXED_CEX
    | typeof EXCHANGE_COMPARATOR_RATE_FILTER_FLOATING_CEX
    | typeof EXCHANGE_COMPARATOR_RATE_FILTER_DEX;

export interface TradingExchangeFormProps extends FormState {
    receiveCryptoSelect: TradingCryptoSelectItemProps | null;
    sendCryptoSelect: TradingAccountOptionsGroupOptionProps | undefined;
    amountInCrypto: boolean;
    [FORM_RATE_TYPE]: RateType;
    [FORM_EXCHANGE_TYPE]: ExchangeType;
    [EXCHANGE_COMPARATOR_KYC_FILTER]: KycFilter;
    [EXCHANGE_COMPARATOR_RATE_FILTER]: RateTypeFilter;
}

export type TradingBuySellFormProps = TradingBuyFormProps | TradingSellFormProps;
export type TradingSellExchangeFormProps = TradingSellFormProps | TradingExchangeFormProps;
export type TradingAllFormProps =
    | TradingBuyFormProps
    | TradingSellFormProps
    | TradingExchangeFormProps;

export interface TradingSellFormDefaultValuesProps {
    defaultValues: TradingSellFormProps;
    defaultCountry: Option;
    defaultCurrency: Option;
    defaultPaymentMethod: TradingPaymentMethodListProps;
}

export interface TradingExchangeFormDefaultValuesProps {
    defaultValues: TradingExchangeFormProps;
    defaultCurrency: Option;
}

export type TradingSellStepType = 'BANK_ACCOUNT' | 'SEND_TRANSACTION';
export type TradingExchangeStepType =
    | 'RECEIVING_ADDRESS'
    | 'SEND_TRANSACTION'
    | 'SEND_APPROVAL_TRANSACTION'
    | 'SIGN_DATA';

interface TradingFormStateProps {
    isFormLoading: boolean;
    isFormInvalid: boolean;
    isLoadingOrInvalid: boolean;

    toggleAmountInCrypto: () => void;
}

interface TradingCommonFormProps {
    device: AppState['device']['selectedDevice'];
    callInProgress: boolean;
    timer: Timer;
    account: Account;
    network: Network;

    goToOffers: () => Promise<void>;
}

interface TradingCommonFormBuySellProps {
    defaultCountry: Option;
    defaultCurrency: Option;
    defaultPaymentMethod: TradingPaymentMethodListProps;
    paymentMethods: TradingPaymentMethodListProps[];
    amountLimits?: AmountLimitProps;
}

type TradingVerifyAccountProps = (
    account: Account,
    address?: string,
    path?: string,
) => (dispatch: Dispatch, getState: GetState) => Promise<void>;

export interface TradingBuyFormContextProps
    extends UseFormReturn<TradingBuyFormProps>,
        TradingCommonFormProps,
        TradingCommonFormBuySellProps {
    type: TradingBuyType;
    buyInfo?: TradingBuyInfoSelector;
    cryptoInputValue?: string;
    quotesRequest: BuyTradeQuoteRequest | undefined;
    quotes: BuyTrade[];
    selectedQuote: BuyTrade | undefined;
    trade?: TradingTransactionBuy;
    addressVerified: string | undefined;
    // form - additional helpers for form
    form: {
        state: TradingFormStateProps;
    };

    selectQuote: (quote: BuyTrade) => Promise<void>;
    confirmTrade: (address: string) => void;
    verifyAddress: TradingVerifyAccountProps;
    removeDraft: (key: string) => void;
    setAmountLimits: (limits?: AmountLimitProps) => void;
}

export interface TradingSellFormContextProps
    extends UseFormReturn<TradingSellFormProps>,
        TradingCommonFormProps,
        TradingCommonFormBuySellProps {
    type: TradingSellType;
    isComposing: boolean;
    sellInfo?: TradingSellInfoSelector;
    localCurrencyOption: { label: string; value: string };
    composedLevels?: PrecomposedLevels | PrecomposedLevelsCardano;
    quotesRequest: AppState['wallet']['trading']['sell']['quotesRequest'];
    feeInfo: FeeInfo;
    quotes: AppState['wallet']['trading']['sell']['quotes'];
    selectedQuote?: SellFiatTrade;
    trade?: TradingTransactionSell;
    suiteReceiveAccounts?: AppState['wallet']['accounts'];
    sellStep: TradingSellStepType;
    // form - additional helpers for form
    form: {
        state: TradingFormStateProps;
        helpers: TradingUseFormActionsReturnProps;
    };
    shouldSendInSats: boolean | undefined;
    changeFeeLevel: (level: FeeLevel['label']) => void;
    composeRequest: SendContextValues<TradingSellExchangeFormProps>['composeTransaction'];
    setAmountLimits: (limits?: AmountLimitProps) => void;

    setSellStep: (step: TradingSellStepType) => void;
    addBankAccount: () => void;
    confirmTrade: (bankAccount: BankAccount) => void;
    sendTransaction: () => void;
    needToRegisterOrVerifyBankAccount: (quote: SellFiatTrade) => boolean;
    selectQuote: (quote: SellFiatTrade) => void;
}

export interface TradingExchangeFormContextProps
    extends UseFormReturn<TradingExchangeFormProps>,
        TradingCommonFormProps {
    type: TradingExchangeType;
    // form - additional helpers for form
    form: {
        state: TradingFormStateProps;
        helpers: TradingUseFormActionsReturnProps;
    };

    selectedQuote?: ExchangeTrade;
    trade?: TradingTransactionExchange;
    suiteReceiveAccounts?: AccountsState;
    exchangeStep: TradingExchangeStepType;
    feeInfo: FeeInfo;

    exchangeInfo?: ExchangeInfo;
    defaultCurrency: Option;
    amountLimits?: CryptoAmountLimitProps;
    composedLevels?: PrecomposedLevels | PrecomposedLevelsCardano;
    quotes: ExchangeTrade[] | undefined;
    cexQuotes: ExchangeTrade[] | undefined;
    dexQuotes: ExchangeTrade[] | undefined;
    quotesRequest: ExchangeTradeQuoteRequest | undefined;
    receiveAccount?: Account;
    addressVerified: string | undefined;
    shouldSendInSats: boolean | undefined;
    setReceiveAccount: (account?: Account) => void;
    setAmountLimits: (limits?: CryptoAmountLimitProps) => void;
    composeRequest: SendContextValues<TradingSellExchangeFormProps>['composeTransaction'];
    changeFeeLevel: (level: FeeLevel['label']) => void;
    removeDraft: (key: string) => void;

    setExchangeStep: (step: TradingExchangeStepType) => void;
    confirmTrade: (address: string, extraField?: string, trade?: ExchangeTrade) => Promise<boolean>;
    sendTransaction: () => Promise<void>;
    signDataAndConfirm: () => Promise<void>;
    selectQuote: (quote: ExchangeTrade) => void;
    verifyAddress: TradingVerifyAccountProps;
}

export type TradingFormMapProps = {
    buy: TradingBuyFormContextProps;
    sell: TradingSellFormContextProps;
    exchange: TradingExchangeFormContextProps;
};

export type TradingFormContextValues<T extends TradingType> = TradingFormMapProps[T];

export type TradingPaymentMethodHookProps<T extends TradingType> = {
    paymentMethods: TradingPaymentMethodListProps[];
    getPaymentMethods: (quotes: TradingTradeMapProps[T][]) => TradingPaymentMethodListProps[];
    getQuotesByPaymentMethod: (
        quotes: TradingTradeMapProps[T][] | undefined,
        currentPaymentMethod: TradingPaymentMethodProps,
    ) => TradingTradeMapProps[T][] | undefined;
};

export interface TradingFormInputDefaultProps {
    label?: TranslationKey;
    'data-testid'?: string;
}

export interface TradingFormInputCryptoSelectProps<TFieldValues extends FieldValues>
    extends TradingFormInputDefaultProps {
    cryptoSelectName: FieldPath<TFieldValues>;
    supportedCryptoCurrencies: Set<CryptoId> | undefined;
    methods: UseFormReturn<TFieldValues>;
    isDisabled?: boolean;
}

export interface TradingFormInputFiatCryptoProps<TFieldValues extends FieldValues> {
    methods: UseFormReturn<TFieldValues>;
    cryptoInputName: FieldPath<TFieldValues>;
    fiatInputName: FieldPath<TFieldValues>;
    cryptoSelectName: FieldPath<TFieldValues>;
    labelLeft?: React.ReactNode;
    labelRight?: React.ReactNode;
}

export interface TradingFormInputFiatCryptoWrapProps<TFieldValues extends FieldValues> {
    showLabel?: boolean;
    methods: UseFormReturn<TFieldValues>;
    cryptoInputName: FieldPath<TFieldValues>;
    fiatInputName: FieldPath<TFieldValues>;
    cryptoSelectName: FieldPath<TFieldValues>;
    cryptoCurrencyLabel?: CryptoId;
    currencySelectLabel?: string;
}

export interface TradingFormInputAccountProps<TFieldValues extends FieldValues> {
    label?: TranslationKey;
    accountSelectName: FieldPath<TFieldValues>;
    methods: UseFormReturn<TFieldValues>;
    'data-testid'?: string;
}

export interface TradingFormInputCurrencyProps {
    isClean?: boolean;
    width?: number;
}

export interface TradingUseFormActionsProps<T extends TradingSellExchangeFormProps> {
    account: Account;
    methods: UseFormReturn<T>;
    isNotFormPage: boolean;
    draftUpdated: TradingSellExchangeFormProps | null;
    type: TradingTradeSellExchangeType;
    handleChange: (offLoading?: boolean) => Promise<void>;
    setAmountLimits: (limits?: AmountLimitProps) => void;
    changeFeeLevel: (level: FeeLevel['label']) => void;
    composeRequest: SendContextValues<TradingSellExchangeFormProps>['composeTransaction'];
    setAccountOnChange: (account: Account) => void;
    setComposedLevels: (levels: PrecomposedLevels | PrecomposedLevelsCardano | undefined) => void;
}

export interface TradingUseFormActionsReturnProps {
    isBalanceZero: boolean;

    onCryptoCurrencyChange: (selected: TradingAccountOptionsGroupOptionProps) => Promise<void>;
    onFiatCurrencyChange: (value: FiatCurrencyCode) => void;
    setRatioAmount: (divisor: number) => void;
    setAllAmount: () => void;
}

export interface TradingUseComposeTransactionProps<T extends TradingSellExchangeFormProps> {
    account: Account;
    network: Network;
    methods: UseFormReturn<T>;
    values: T;
}

export interface TradingUseComposeTransactionStateProps {
    account: Account;
    network: Network;
    feeInfo: FeeInfo;
}

export interface TradingUseComposeTransactionReturnProps
    extends TradingUseComposeTransactionStateProps {
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

export interface TradingOfferExchangeProps
    extends Omit<TradingOfferCommonProps, 'paymentMethod' | 'paymentMethodName'> {
    selectedQuote: ExchangeTrade;
}

export interface TradingSelectedOfferInfoProps extends TradingOfferCommonProps {
    selectedAccount?: Account;
    transactionId?: string;
}
