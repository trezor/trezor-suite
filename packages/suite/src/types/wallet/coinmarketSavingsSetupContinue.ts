import type { SavingsKYCStatus, SavingsTrade } from 'invity-api';
import type { WithSelectedAccountLoadedProps } from 'src/components/wallet';
import type { Account } from 'src/types/wallet';
import type { Option, Savings } from 'src/types/wallet/coinmarketCommonTypes';
import type { SuiteUseFormReturn } from '@suite-common/wallet-types';

export type UseSavingsSetupContinueProps = WithSelectedAccountLoadedProps;

export interface SavingsSetupContinueFormState extends Savings {
    address?: string;
}

export interface SavingsSetupContinueContextValues
    extends SuiteUseFormReturn<SavingsSetupContinueFormState> {
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
}
