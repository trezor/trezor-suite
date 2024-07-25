import {
    CoinmarketAccountOptionsGroupOptionProps,
    CoinmarketCryptoListProps,
    CoinmarketPaymentMethodListProps,
    CoinmarketPaymentMethodProps,
    CoinmarketTradeDetailMapProps,
    CoinmarketTradeType,
} from 'src/types/coinmarket/coinmarket';
import type { Account, Network } from 'src/types/wallet';
import type { BuyInfo } from 'src/actions/wallet/coinmarketBuyActions';
import type { UseFormReturn } from 'react-hook-form';
import type { BankAccount, BuyTrade, FiatCurrencyCode, SellFiatTrade } from 'invity-api';
import { Timer } from '@trezor/react-utils';
import { AppState } from 'src/reducers/store';
import { ExtendedMessageDescriptor } from 'src/types/suite';
import { PropsWithChildren } from 'react';
import { AmountLimits, Option, TradeSell } from 'src/types/wallet/coinmarketCommonTypes';
import {
    FeeInfo,
    FormState,
    PrecomposedLevels,
    PrecomposedLevelsCardano,
    Rate,
} from '@suite-common/wallet-types';
import { FeeLevel } from '@trezor/connect';
import { SendContextValues } from 'src/types/wallet/sendForm';
import { SellFormState } from 'src/types/wallet/coinmarketSellForm';
import { SellInfo } from 'src/actions/wallet/coinmarketSellActions';
import { CoinmarketSellStepType } from 'src/types/coinmarket/coinmarketOffers';
import { FeesState } from '@suite-common/wallet-core';

export interface CoinmarketBuyFormProps {
    fiatInput?: string;
    cryptoInput?: string;
    currencySelect: Option;
    cryptoSelect: CoinmarketCryptoListProps;
    countrySelect: Option;
    paymentMethod?: CoinmarketPaymentMethodListProps;
    amountInCrypto: boolean;
}

export interface CoinmarketBuyFormDefaultValuesProps {
    defaultValues: CoinmarketBuyFormProps;
    defaultCountry: Option;
    defaultCurrency: Option;
    defaultPaymentMethod: CoinmarketPaymentMethodListProps;
    suggestedFiatCurrency: FiatCurrencyCode;
}

export interface CoinmarketSellFormProps
    extends FormState,
        Omit<CoinmarketBuyFormProps, 'cryptoSelect'> {
    cryptoSelect: CoinmarketAccountOptionsGroupOptionProps | undefined;
}

export interface CoinmarketSellFormDefaultValuesProps {
    defaultValues: CoinmarketSellFormProps;
    defaultCountry: Option;
    defaultCurrency: Option;
    defaultPaymentMethod: CoinmarketPaymentMethodListProps;
}

interface CoinmarketFormStateProps {
    isFormLoading: boolean;
    isFormInvalid: boolean;
    isLoadingOrInvalid: boolean;

    toggleAmountInCrypto: () => void;
}

export interface CoinmarketCommonFormProps {
    device: AppState['device']['selectedDevice'];
    callInProgress: boolean;
    timer: Timer;
    account: Account;
    type: CoinmarketTradeType;
    defaultCountry: Option;
    defaultCurrency: Option;
    defaultPaymentMethod: CoinmarketPaymentMethodListProps;
    paymentMethods: CoinmarketPaymentMethodListProps[];
    amountLimits?: AmountLimits;
    network: Network;
    goToOffers: () => Promise<void>;
}

export interface CoinmarketBuyFormContextProps
    extends UseFormReturn<CoinmarketBuyFormProps>,
        CoinmarketCommonFormProps {
    buyInfo?: BuyInfo;
    cryptoInputValue?: string;
    quotesRequest: AppState['wallet']['coinmarket']['buy']['quotesRequest'];
    quotes: AppState['wallet']['coinmarket']['buy']['quotes'];
    selectedQuote: BuyTrade | undefined;
    addressVerified: AppState['wallet']['coinmarket']['buy']['addressVerified'];
    // form - additional helpers for form
    form: {
        state: CoinmarketFormStateProps;
    };

    selectQuote: (quote: BuyTrade) => Promise<void>;
    goToPayment: (address: string) => void;
    verifyAddress: (account: Account, address?: string, path?: string) => Promise<void>;
    removeDraft: (key: string) => void;
    setAmountLimits: (limits?: AmountLimits) => void;
}

export interface CoinmarketSellFormContextProps
    extends UseFormReturn<CoinmarketSellFormProps>,
        CoinmarketCommonFormProps {
    isComposing: boolean;
    sellInfo?: SellInfo;
    localCurrencyOption: { label: string; value: string };
    composedLevels?: PrecomposedLevels | PrecomposedLevelsCardano;
    quotesRequest: AppState['wallet']['coinmarket']['sell']['quotesRequest'];
    feeInfo: FeeInfo;
    quotes: AppState['wallet']['coinmarket']['sell']['quotes'];
    selectedQuote?: SellFiatTrade;
    trade?: TradeSell;
    suiteReceiveAccounts?: AppState['wallet']['accounts'];
    sellStep: CoinmarketSellStepType;
    // form - additional helpers for form
    form: {
        state: CoinmarketFormStateProps;
        helpers: CoinmarketFormHelpersProps;
    };

    changeFeeLevel: (level: FeeLevel['label']) => void;
    composeRequest: SendContextValues<SellFormState>['composeTransaction'];
    setAmountLimits: (limits?: AmountLimits) => void;

    setSellStep: (step: CoinmarketSellStepType) => void;
    addBankAccount: () => void;
    confirmTrade: (bankAccount: BankAccount) => void;
    sendTransaction: () => void;
    needToRegisterOrVerifyBankAccount: (quote: SellFiatTrade) => boolean;
    selectQuote: (quote: SellFiatTrade) => void;
}

export type CoinmarketFormMapProps = {
    buy: CoinmarketBuyFormContextProps;
    sell: CoinmarketSellFormContextProps;
    exchange: any; // TODO: replacing any will bring a lot of problems, be ready
};

export type CoinmarketFormContextValues<T extends CoinmarketTradeType> = CoinmarketFormMapProps[T];

export type CoinmarketPaymentMethodHookProps<T extends CoinmarketTradeType> = {
    paymentMethods: CoinmarketPaymentMethodListProps[];
    getPaymentMethods: (
        quotes: CoinmarketTradeDetailMapProps[T][],
    ) => CoinmarketPaymentMethodListProps[];
    getQuotesByPaymentMethod: (
        quotes: CoinmarketTradeDetailMapProps[T][] | undefined,
        currentPaymentMethod: CoinmarketPaymentMethodProps,
    ) => CoinmarketTradeDetailMapProps[T][] | undefined;
};

export interface CoinmarketFormInputLabelProps extends PropsWithChildren {
    label?: ExtendedMessageDescriptor['id'];
}

export interface CoinmarketFormInputCommonProps {
    className?: string;
}

export interface CoinmarketFormInputProps
    extends CoinmarketFormInputLabelProps,
        CoinmarketFormInputCommonProps {}

export interface CoinmarketFormInputFiatCryptoProps extends CoinmarketFormInputCommonProps {
    showLabel?: boolean;
}

export interface CoinmarketUseSellFormHelpersProps {
    account: Account;
    network: Network;
    methods: UseFormReturn<CoinmarketSellFormProps>;
    setAccount: (account: Account) => void;
    setAmountLimits: (limits?: AmountLimits) => void;
    changeFeeLevel: (level: FeeLevel['label']) => void;
}

export interface CoinmarketFormHelpersProps {
    isBalanceZero: boolean;
    fiatRate: Rate | undefined;

    onCryptoAmountChange: (amount: string) => void;
    onFiatAmountChange: (amount: string) => void;
    onCryptoCurrencyChange: (selected: CoinmarketAccountOptionsGroupOptionProps) => void;
    setRatioAmount: (divisor: number) => void;
    setAllAmount: () => void;
}

export interface CoinmarketUseSellFormStateProps {
    account: Account;
    network: Network;
    fees: FeesState;
    defaultFormValues?: CoinmarketSellFormProps;
}

export interface CoinmarketUseSellFormStateReturnProps {
    account: Account;
    network: Network;
    feeInfo: FeeInfo & {
        levels: {
            feeLimit?: string | undefined;
            feePerTx?: string | undefined;
            label: 'high' | 'normal' | 'economy' | 'low' | 'custom';
            feePerUnit: string;
            blocks: number;
        }[];
    };
    formValues?: CoinmarketSellFormProps;
}
