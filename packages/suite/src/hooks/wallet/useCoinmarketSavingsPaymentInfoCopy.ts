import type { SavingsPaymentInfo } from 'invity-api';
import { copyToClipboard } from '@trezor/dom-utils';
import { useDispatch } from 'src/hooks/suite';
import { notificationsActions } from '@suite-common/toast-notifications';

export const useCoinmarketSavingsPaymentInfoCopy = (paymentInfo?: SavingsPaymentInfo) => {
    const dispatch = useDispatch();

    const copyPaymentInfo = (paymentInfoKey: keyof SavingsPaymentInfo) => {
        if (paymentInfo) {
            const paymentInfoValue = paymentInfo[paymentInfoKey];
            const result = paymentInfoValue && copyToClipboard(paymentInfoValue);
            if (typeof result !== 'string') {
                dispatch(notificationsActions.addToast({ type: 'copy-to-clipboard' }));
            }
        }
    };

    return {
        copyPaymentInfo,
    };
};
