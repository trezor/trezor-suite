import type { PaymentFrequency } from '@suite-services/invityAPI';
import type { WithSelectedAccountLoadedProps } from '@wallet-components';
import type { TypedValidationRules } from '@wallet-types/form';
import type { UseFormMethods } from 'react-hook-form';
import type { CountryOption, Option } from '@wallet-types/coinmarketCommonTypes';
import type { Account } from '@wallet-types';

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
    paymentFrequencyOptions: Option[];
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
