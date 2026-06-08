import type { BuyCryptoPaymentMethod } from 'invity-api';

import { Translation } from '@suite-native/intl';
import type { ExtendedSellCryptoPaymentMethod } from '@suite-native/trading-types';

type PaymentMethodTranslationMethod = BuyCryptoPaymentMethod | ExtendedSellCryptoPaymentMethod;

export type PaymentMethodTranslationProps = {
    paymentMethod?: PaymentMethodTranslationMethod | string;
    paymentMethodName?: string;
};

export const PaymentMethodTranslation = ({
    paymentMethod,
    paymentMethodName,
}: PaymentMethodTranslationProps) => {
    switch (paymentMethod) {
        case 'bankTransfer':
            return <Translation id="moduleTrading.paymentMethods.bankTransfer" />;
        case 'creditCard':
            return <Translation id="moduleTrading.paymentMethods.creditCard" />;
        case 'sepa':
            return <Translation id="moduleTrading.paymentMethods.sepa" />;
        case 'ach':
            return <Translation id="moduleTrading.paymentMethods.ach" />;
        case 'skrill':
            return <Translation id="moduleTrading.paymentMethods.skrill" />;
        case 'neteller':
            return <Translation id="moduleTrading.paymentMethods.neteller" />;
        case 'payid':
            return <Translation id="moduleTrading.paymentMethods.payid" />;
        case 'dcinterac':
            return <Translation id="moduleTrading.paymentMethods.dcinterac" />;
        case 'fasterPayment':
            return <Translation id="moduleTrading.paymentMethods.fasterPayment" />;
        default:
            return paymentMethodName || paymentMethod || '';
    }
};
