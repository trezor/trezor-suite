import type { BuyCryptoPaymentMethod } from 'invity-api';

import { Translation, type TxKeyPath } from '@suite-native/intl';
import type { ExtendedSellCryptoPaymentMethod } from '@suite-native/trading-types';

type PaymentMethodTranslationMethod = BuyCryptoPaymentMethod | ExtendedSellCryptoPaymentMethod;

export type PaymentMethodTranslationProps = {
    paymentMethod?: PaymentMethodTranslationMethod | string;
    paymentMethodName?: string;
};

const paymentMethodTranslationMap = {
    bankTransfer: 'moduleTrading.paymentMethods.bankTransfer',
    creditCard: 'moduleTrading.paymentMethods.creditCard',
    sepa: 'moduleTrading.paymentMethods.sepa',
    ach: 'moduleTrading.paymentMethods.ach',
    skrill: 'moduleTrading.paymentMethods.skrill',
    neteller: 'moduleTrading.paymentMethods.neteller',
    payid: 'moduleTrading.paymentMethods.payid',
    dcinterac: 'moduleTrading.paymentMethods.dcinterac',
    fasterPayment: 'moduleTrading.paymentMethods.fasterPayment',
} as const satisfies Partial<Record<PaymentMethodTranslationMethod, TxKeyPath>>;

const getPaymentMethodTranslationId = (paymentMethod?: string): TxKeyPath | undefined => {
    if (paymentMethod && paymentMethod in paymentMethodTranslationMap) {
        return paymentMethodTranslationMap[
            paymentMethod as keyof typeof paymentMethodTranslationMap
        ];
    }

    return undefined;
};

export const PaymentMethodTranslation = ({
    paymentMethod,
    paymentMethodName,
}: PaymentMethodTranslationProps) => {
    const paymentMethodTranslationId = getPaymentMethodTranslationId(paymentMethod);

    if (paymentMethodTranslationId) {
        return <Translation id={paymentMethodTranslationId} />;
    }

    return (paymentMethodName || paymentMethod) ?? '';
};
