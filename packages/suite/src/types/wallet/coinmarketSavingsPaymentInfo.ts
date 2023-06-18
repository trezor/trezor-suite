import type { SavingsKYCStatus, SavingsPaymentInfo } from 'invity-api';
import type { WithSelectedAccountLoadedProps } from 'src/components/wallet';
import { SavingsContextValues } from './coinmarketSavings';

export type UseSavingsPaymentInfoProps = WithSelectedAccountLoadedProps;

export type SavingsPaymentInfoContextValues = SavingsContextValues & {
    handleEditButtonClick: () => void;
    handleSubmit: () => void;
    isSubmitting: boolean;
    copyPaymentInfo: (paymentInfoKey: keyof SavingsPaymentInfo) => void;
    kycFinalStatus?: SavingsKYCStatus;
    selectedProviderName?: string;
};
