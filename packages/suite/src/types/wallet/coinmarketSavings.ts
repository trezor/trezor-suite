import type { SavingsTrade, SavingsTradePlannedPayment } from 'invity-api';

export type SavingsContextValues = {
    isWatchingKYCStatus: boolean;
    isSavingsTradeLoading: boolean;
    savingsTrade?: SavingsTrade;
    savingsTradePayments?: SavingsTradePlannedPayment[];
};
