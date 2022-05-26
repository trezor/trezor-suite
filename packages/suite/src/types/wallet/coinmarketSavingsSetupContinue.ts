import type { PaymentFrequency, SavingsKYCStatus, SavingsTrade } from '@suite-services/invityAPI';
import type { WithSelectedAccountLoadedProps } from '@wallet-components';
import type { TypedValidationRules } from '@wallet-types/form';
import type { UseFormMethods } from 'react-hook-form';
import type { Account } from '@wallet-types';
import type { Option } from '@wallet-types/coinmarketCommonTypes';

export type UseSavingsSetupContinueProps = WithSelectedAccountLoadedProps;

export interface SavingsSetupContinueFormState {
    paymentFrequency: PaymentFrequency;
    fiatAmount: string;
    customFiatAmount: string;
    address?: string;
}

export type SavingsSetupContinueContextValues = Omit<
    UseFormMethods<SavingsSetupContinueFormState>,
    'register'
> & {
    register: (rules?: TypedValidationRules) => (ref: any) => void; // TODO: ReturnType of UseFormMethods['register'] union
    onSubmit: (data: SavingsSetupContinueFormState) => void;
    annualSavingsFiatAmount: number;
    annualSavingsCryptoAmount: string;
    fiatAmount?: string;
    fiatCurrency?: string;
    isWatchingKYCStatus: boolean;
    canConfirmSetup: boolean;
    account: Account;
    address?: string;
    isSubmitting: boolean;
    paymentFrequencyOptions: Option[];
    paymentAmounts: string[];
    minimumPaymentAmountLimit?: number;
    maximumPaymentAmountLimit?: number;
    savingsTrade?: SavingsTrade;
    isSavingsTradeLoading: boolean;
    kycFinalStatus?: SavingsKYCStatus;
    selectedProviderName?: string;
    showReceivingAddressChangePaymentInfoLabel: boolean;
};
