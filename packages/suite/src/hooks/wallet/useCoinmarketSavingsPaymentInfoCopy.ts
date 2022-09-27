import type { SavingsPaymentInfo } from 'invity-api';
import { copyToClipboard } from '@trezor/dom-utils';
import { useActions } from '@suite-hooks';
import * as notificationActions from '@suite-actions/notificationActions';

export const useCoinmarketSavingsPaymentInfoCopy = (paymentInfo?: SavingsPaymentInfo) => {
    const { addNotification } = useActions({ addNotification: notificationActions.addToast });
    const copyPaymentInfo = (paymentInfoKey: keyof SavingsPaymentInfo) => {
        if (paymentInfo) {
            const paymentInfoValue = paymentInfo[paymentInfoKey];
            const result = paymentInfoValue && copyToClipboard(paymentInfoValue, null);
            if (typeof result !== 'string') {
                addNotification({ type: 'copy-to-clipboard' });
            }
        }
    };
    return {
        copyPaymentInfo,
    };
};
