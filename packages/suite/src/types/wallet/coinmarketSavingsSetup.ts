import type { PaymentFrequency } from 'invity-api';
import type { WithSelectedAccountLoadedProps } from 'src/components/wallet';
import type {
    CountryOption,
    PaymentFrequencyOption,
    Savings,
} from 'src/types/wallet/coinmarketCommonTypes';
import type { Account } from 'src/types/wallet';
import { SuiteUseFormReturn } from '@suite-common/wallet-types';

export type UseSavingsSetupProps = WithSelectedAccountLoadedProps;

export interface SavingsSetupFormState extends Savings {
    country?: CountryOption;
}

export interface SavingsSetupContextValues extends SuiteUseFormReturn<SavingsSetupFormState> {
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
}

export type PaymentFrequencyTranslationId =
    | 'TR_SAVINGS_SETUP_PAYMENT_FREQUENCY_DAILY'
    | 'TR_SAVINGS_SETUP_PAYMENT_FREQUENCY_WEEKLY'
    | 'TR_SAVINGS_SETUP_PAYMENT_FREQUENCY_BIWEEKLY'
    | 'TR_SAVINGS_SETUP_PAYMENT_FREQUENCY_MONTHLY'
    | 'TR_SAVINGS_SETUP_PAYMENT_FREQUENCY_QUARTERLY';
