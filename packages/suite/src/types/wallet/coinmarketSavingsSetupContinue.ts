import type { PaymentFrequency, SavingsKYCStatus, SavingsTrade } from 'invity-api';
import type { WithSelectedAccountLoadedProps } from 'src/components/wallet';
import type { TypedValidationRules } from 'src/types/wallet/form';
import type { UseFormMethods } from 'react-hook-form';
import type { Account } from 'src/types/wallet';
import type { Option } from 'src/types/wallet/coinmarketCommonTypes';

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
