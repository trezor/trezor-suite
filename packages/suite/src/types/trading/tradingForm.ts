import type React from 'react';
import type { FieldPath, UseFormReturn } from 'react-hook-form';

import { type UnknownAction } from '@reduxjs/toolkit';
import type { BuyTrade, CryptoId, ExchangeTrade, FiatCurrencyCode } from 'invity-api';
import { type ThunkDispatch } from 'redux-thunk';

import type { TranslationKey } from '@suite/intl';
import { type OpenModalDep } from '@suite-common/suite-types';
import type {
    TRADING_FORM_CRYPTO_CURRENCY_SELECT,
    TRADING_FORM_CRYPTO_INPUT,
    TRADING_FORM_FIAT_INPUT,
    TRADING_FORM_OUTPUT_AMOUNT,
    TRADING_FORM_OUTPUT_FIAT,
    TRADING_FORM_SEND_CRYPTO_CURRENCY_SELECT,
    TradingAssetSellOption,
    TradingBuyFormProps,
    TradingBuyType,
    TradingComposedTransactionInfo,
    TradingExchangeFormProps,
    TradingExchangeType,
    TradingPaymentMethodType,
    TradingRootState,
    TradingSellFormProps,
    TradingSellType,
    TradingTradeType,
    TradingType,
    TradingVerifiedAddress,
} from '@suite-common/trading';
import { type Network } from '@suite-common/wallet-config';
import {
    type AccountsState,
    type ConfirmAddressOnDeviceThunkState,
    type WalletSettingsRootState,
} from '@suite-common/wallet-core';
import {
    type FeeInfo,
    type PrecomposedLevels,
    type PrecomposedLevelsCardano,
} from '@suite-common/wallet-types';
import { type FeeLevel } from '@trezor/connect';

import { type useTradingReceiveAddress } from 'src/hooks/wallet/trading/form/useTradingReceiveAddress';
import {
    type TradingGetCryptoQuoteAmountProps,
    type TradingGetProvidersInfoProps,
    type TradingTradeSellExchangeType,
} from 'src/types/trading/trading';
import type { Account } from 'src/types/wallet';
import { type SendContextValues } from 'src/types/wallet/sendForm';
import { type AmountLimitProps, type CryptoAmountLimitProps } from 'src/utils/suite/validation';

export interface TradingBuyFormDefaultValuesProps {
    defaultValues: TradingBuyFormProps;
}

export type TradingBuySellFormProps = TradingBuyFormProps | TradingSellFormProps;
export type TradingSellExchangeFormProps = TradingSellFormProps | TradingExchangeFormProps;
export type TradingAllFormProps =
    TradingBuyFormProps | TradingSellFormProps | TradingExchangeFormProps;

export interface TradingSellFormDefaultValuesProps {
    defaultValues: TradingSellFormProps;
}

export interface TradingExchangeFormDefaultValuesProps {
    defaultValues: TradingExchangeFormProps;
}

interface TradingFormStateProps {
    isFormLoading: boolean;
    isFormInvalid: boolean;
    isLoadingOrInvalid: boolean;

    toggleAmountInCrypto: () => void;
}

interface TradingCommonFormProps {
    network: Network | undefined;
}

interface TradingCommonFormBuySellProps {
    amountLimits?: AmountLimitProps;
}

type TradingVerifyAccountProps = (
    account: Account,
    address?: string,
    path?: string,
) => (
    dispatch: ThunkDispatch<
        ConfirmAddressOnDeviceThunkState & TradingRootState & WalletSettingsRootState,
        { actions: OpenModalDep },
        UnknownAction
    >,
    getState: () => ConfirmAddressOnDeviceThunkState & TradingRootState & WalletSettingsRootState,
) => Promise<void>;

export interface TradingBuyFormContextProps
    extends
        UseFormReturn<TradingBuyFormProps>,
        TradingCommonFormProps,
        TradingCommonFormBuySellProps {
    type: TradingBuyType;
    // form - additional helpers for form
    form: {
        state: TradingFormStateProps;
    };
    tradingReceiveAddress: ReturnType<typeof useTradingReceiveAddress>;
    isAmountEmpty: boolean;

    setAmountLimits: (limits?: AmountLimitProps) => void;
    methods: UseFormReturn<TradingBuyFormProps>;
}

export interface TradingSellFormContextProps
    extends
        UseFormReturn<TradingSellFormProps>,
        TradingCommonFormProps,
        TradingCommonFormBuySellProps {
    type: TradingSellType;
    isComposing: boolean;
    composedLevels?: PrecomposedLevels | PrecomposedLevelsCardano;
    feeInfo: FeeInfo;
    suiteReceiveAccounts?: AccountsState;
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

    methods: UseFormReturn<TradingSellFormProps>;
    showReserveBanner: boolean;
    setShowReserveBanner: (showReserveBanner: boolean) => void;
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

    suiteReceiveAccounts?: AccountsState;
    feeInfo: FeeInfo;

    amountLimits?: CryptoAmountLimitProps;
    isComposing: boolean;
    composedLevels?: PrecomposedLevels | PrecomposedLevelsCardano;
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
    refreshQuotes: () => Promise<void>;
    isScheduledQuotesRefresh: boolean;
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
    account: Account | undefined;
    methods: UseFormReturn<T>;
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
    account: Account | undefined;
    network: Network | undefined;
    methods: UseFormReturn<T>;
    setShowReserveBanner: (showReserveBanner: boolean) => void;
    shouldSuppressComposeErrors?: boolean;
}

export interface TradingUseComposeTransactionStateProps {
    account: Account | undefined;
    network: Network | undefined;
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
    selectedQuote: TradingTradeType;
    providers: TradingGetProvidersInfoProps;
    type: TradingType;
    quoteAmounts: TradingGetCryptoQuoteAmountProps | null;
    paymentMethod?: TradingPaymentMethodType;
    paymentMethodName?: string;
}

export interface TradingOfferBuyProps {
    selectedQuote: BuyTrade;
    isConfirmDisabled: boolean;
    confirmTrade: () => Promise<BuyTrade | undefined>;
}

export interface TradingOfferExchangeProps extends Omit<
    TradingOfferCommonProps,
    'paymentMethod' | 'paymentMethodName'
> {
    selectedQuote: ExchangeTrade;
}

export interface TradingSelectedOfferInfoProps extends TradingOfferCommonProps {
    selectedAccount?: Account;
    receiveAddress?: string;
}
