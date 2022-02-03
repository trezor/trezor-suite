import type { PaymentFrequency, SavingsPaymentInfo } from '@suite-services/invityAPI';
import type { WithSelectedAccountLoadedProps } from '@wallet-components';

export type UseSavingsPaymentInfoProps = WithSelectedAccountLoadedProps;

export type SavingsPaymentInfoContextValues = {
    paymentFrequency?: PaymentFrequency;
    fiatAmount?: string;
    fiatCurrency?: string;
    paymentInfo?: SavingsPaymentInfo;
    handleEditButtonClick: () => void;
    handleSubmit: () => void;
    copy: (paymentInfoKey: keyof SavingsPaymentInfo) => void;
};
