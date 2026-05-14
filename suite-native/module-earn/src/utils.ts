import { type FormState } from '@suite-common/wallet-types';

import { USER_CANCELLED_ERROR_CODES } from './constants';

export const buildEarnComposeFormState = (
    contractAddress: string,
    amount: string,
    calldata: string,
): FormState => ({
    outputs: [
        {
            address: contractAddress,
            amount,
            type: 'payment',
            token: null,
            fiat: '',
            currency: { label: '', value: '' },
        },
    ],
    options: ['transactionData'],
    transactionData: calldata,
    isCoinControlEnabled: false,
    hasCoinControlBeenOpened: false,
    selectedUtxos: [],
    selectedFee: 'normal',
    feePerUnit: '',
    feeLimit: '',
});

type HandleEarnReviewErrorProps = {
    payload: { error?: string; errorCode?: string; message?: string } | undefined;
    navigation: { pop: () => void };
    showPushTransactionFailedAlert: () => void;
    showPendingTransactionConflictAlert: () => void;
    showDeviceDisconnectedAlert: () => void;
};

export const handleEarnReviewError = ({
    payload,
    navigation,
    showPushTransactionFailedAlert,
    showPendingTransactionConflictAlert,
    showDeviceDisconnectedAlert,
}: HandleEarnReviewErrorProps) => {
    if (payload?.message === 'tx-cancelled') {
        return;
    }

    if (payload?.error === 'push-transaction-pending-conflict') {
        showPendingTransactionConflictAlert();

        return;
    }

    if (payload?.error === 'push-transaction-failed') {
        showPushTransactionFailedAlert();

        return;
    }

    const errorCode = payload?.errorCode;

    if (USER_CANCELLED_ERROR_CODES.some(code => code === errorCode)) {
        navigation.pop();

        return;
    }

    showDeviceDisconnectedAlert();
};
