import { useSelector } from 'react-redux';

import { Translation } from '@suite/intl';
import { selectSelectedDevice } from '@suite-common/device';
import { type SerializedTx } from '@suite-common/wallet-core';
import { ConfirmOnDevicePill } from '@trezor/product-components';

type TransactionReviewModalConfirmOnDeviceProps = {
    totalSteps: number;
    serializedTx: SerializedTx | undefined;
    isSending: boolean;
    reviewStep: number;
    onCancel: () => void;
};

export const TransactionReviewModalConfirmOnDevice = ({
    totalSteps,
    serializedTx,
    isSending,
    reviewStep,
    onCancel,
}: TransactionReviewModalConfirmOnDeviceProps) => {
    const device = useSelector(selectSelectedDevice);
    const deviceModelInternal = device?.features?.internal_model;

    const offsetReviewStep = reviewStep + 1; // adjust for 0-based index

    return (
        <ConfirmOnDevicePill
            title={<Translation id="TR_CONFIRM_ON_TREZOR" />}
            steps={totalSteps}
            activeStep={serializedTx ? totalSteps + 1 : Math.min(offsetReviewStep, totalSteps)}
            deviceModelInternal={deviceModelInternal}
            deviceUnitColor={device?.features?.unit_color}
            successText={<Translation id="TR_CONFIRMED_TX" />}
            onCancel={isSending ? undefined : onCancel}
        />
    );
};
