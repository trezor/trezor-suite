import { useSelector } from 'react-redux';

import { Translation } from '@suite/intl';
import { selectSelectedDevice } from '@suite-common/device';
import { type SerializedTx } from '@suite-common/wallet-core';
import { type ReviewOutput } from '@suite-common/wallet-types';
import { ConfirmOnDevicePill } from '@trezor/product-components';

type TransactionReviewModalConfirmOnDeviceProps = {
    outputs: ReviewOutput[];
    serializedTx: SerializedTx | undefined;
    isSending: boolean;
    reviewStep: number;
    onCancel: () => void;
};

export const TransactionReviewModalConfirmOnDevice = ({
    outputs,
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
            steps={outputs.length + 1}
            activeStep={serializedTx ? outputs.length + 2 : offsetReviewStep}
            deviceModelInternal={deviceModelInternal}
            deviceUnitColor={device?.features?.unit_color}
            successText={<Translation id="TR_CONFIRMED_TX" />}
            onCancel={isSending ? undefined : onCancel}
        />
    );
};
