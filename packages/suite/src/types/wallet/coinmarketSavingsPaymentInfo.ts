import type { SavingsKYCStatus, SavingsPaymentInfo } from 'invity-api';
import { SavingsContextValues } from './coinmarketSavings';

export type SavingsPaymentInfoContextValues = SavingsContextValues & {
    handleEditButtonClick: () => void;
    handleSubmit: () => void;
    isSubmitting: boolean;
    copyPaymentInfo: (paymentInfoKey: keyof SavingsPaymentInfo) => void;
    kycFinalStatus?: SavingsKYCStatus;
    selectedProviderName?: string;
};
