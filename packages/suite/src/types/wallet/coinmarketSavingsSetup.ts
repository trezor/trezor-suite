import type { PaymentFrequency } from 'invity-api';
import type { WithSelectedAccountLoadedProps } from 'src/components/wallet';
import type { TypedValidationRules } from 'src/types/wallet/form';
import type { UseFormMethods } from 'react-hook-form';
import type { CountryOption, PaymentFrequencyOption } from 'src/types/wallet/coinmarketCommonTypes';
import type { Account } from 'src/types/wallet';

export type UseSavingsSetupProps = WithSelectedAccountLoadedProps;

export interface SavingsSetupFormState {
    paymentFrequency: PaymentFrequency;
    fiatAmount: string;
    customFiatAmount: string;
    country?: CountryOption;
}

export type SavingsSetupContextValues = Omit<UseFormMethods<SavingsSetupFormState>, 'register'> & {
    register: (rules?: TypedValidationRules) => (ref: any) => void; // TODO: ReturnType of UseFormMethods['register'] union
    onSubmit: (data: SavingsSetupFormState) => void;
    defaultPaymentFrequency?: PaymentFrequency;
    defaultFiatAmount?: string;
    annualSavingsFiatAmount: number;
    annualSavingsCryptoAmount: string;
    fiatAmount?: string;
    fiatCurrency?: string;
    account: Account;
    canConfirmSetup: boolean;
    isSubmitting: boolean;
    paymentFrequencyOptions: PaymentFrequencyOption[];
    paymentAmounts: string[];
    minimumPaymentAmountLimit?: number;
    maximumPaymentAmountLimit?: number;
    supportedCountries?: Set<string>;
    isProviderSelected: boolean;
    handleOneTimeBuyLinkButtonClick: () => void;
    isSavingsTradeLoading: boolean;
    noProviders: boolean;
    userCountry?: string;
    defaultCountryOption?: CountryOption;
};

export type PaymentFrequencyTranslationId =
    | 'TR_SAVINGS_SETUP_PAYMENT_FREQUENCY_DAILY'
    | 'TR_SAVINGS_SETUP_PAYMENT_FREQUENCY_WEEKLY'
    | 'TR_SAVINGS_SETUP_PAYMENT_FREQUENCY_BIWEEKLY'
    | 'TR_SAVINGS_SETUP_PAYMENT_FREQUENCY_MONTHLY'
    | 'TR_SAVINGS_SETUP_PAYMENT_FREQUENCY_QUARTERLY';
