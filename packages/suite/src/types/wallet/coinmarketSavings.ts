import type { SavingsTrade, SavingsTradePlannedPayment } from '@suite-services/invityAPI';

export type SavingsContextValues = {
    isWatchingKYCStatus: boolean;
    isSavingsTradeLoading: boolean;
    savingsTrade?: SavingsTrade;
    savingsTradePayments?: SavingsTradePlannedPayment[];
};
