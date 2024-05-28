import type { SavingsKYCStatus, SavingsProviderInfo } from 'invity-api';
import type { SavingsContextValues } from './coinmarketSavings';
import type { Account } from 'src/types/wallet';

export type SavingsOverviewContextValues = SavingsContextValues & {
    handleEditSetupButtonClick: () => void;
    savingsTradeItemCompletedExists: boolean;
    savingsCryptoSum: string;
    savingsFiatSum: string;
    kycFinalStatus?: SavingsKYCStatus;
    selectedProvider?: SavingsProviderInfo;
    account: Account;
};
