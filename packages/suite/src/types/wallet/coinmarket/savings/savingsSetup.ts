import type { PaymentFrequency } from '@suite-services/invityAPI';
import type { WithSelectedAccountLoadedProps } from '@wallet-components';
import type { TypedValidationRules } from '@wallet-types/form';
import type { UseFormMethods } from 'react-hook-form';
import type { Account } from '@wallet-types';

export type UseSavingsSetupProps = WithSelectedAccountLoadedProps;

export interface SavingsSetupFormState {
    paymentFrequency: PaymentFrequency;
    fiatAmount: string;
    customFiatAmount: string;
    address?: string;
}

export type SavingsSetupContextValues = Omit<UseFormMethods<SavingsSetupFormState>, 'register'> & {
    register: (rules?: TypedValidationRules) => (ref: any) => void; // TODO: ReturnType of UseFormMethods['register'] union
    onSubmit: (data: SavingsSetupFormState) => void;
    defaultPaymentFrequency?: PaymentFrequency;
    defaultFiatAmount?: string;
    annualSavingsCalculationFiat: number;
    annualSavingsCalculationCrypto: string;
    fiatAmount?: string;
    isWatchingKYCStatus: boolean;
    canConfirmSetup: boolean;
    account: Account;
    address?: string;
    wasSetupSaved: boolean;
    isLoading: boolean;
};
