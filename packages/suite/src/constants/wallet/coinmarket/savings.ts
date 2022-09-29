import type { PaymentFrequency } from 'invity-api';

export const CustomPaymentAmountKey = 'Custom';
export const KYCStatusPollingIntervalMilliseconds = 15_000;
export const KYCStatusPollingMaxCount = 50;
export const SavingsTradePollingIntervalMilliseconds = 5_000;
export const SavingsTradePollingMaxCount = 50;
export const PaymentFrequencyAnnualCoefficient: Record<PaymentFrequency, number> = {
    Daily: 365,
    Weekly: 52,
    Biweekly: 26,
    Monthly: 12,
    Quarterly: 4,
};
