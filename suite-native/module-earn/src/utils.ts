import { USER_CANCELLED_ERROR_CODES } from './constants';

type HandleEarnReviewErrorProps = {
    payload: { error?: string; errorCode?: string } | undefined;
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
