import { ReactNode } from 'react';

import { Modal } from '@trezor/components';

import { ThpPairingFailedForFirmwareInstallation } from '../../../components/thp/ThpPairingFailedForFirmwareInstallation';

type StepThpFailedProps = {
    modalHeading: ReactNode;
};

export const StepThpFailed = ({ modalHeading }: StepThpFailedProps) => (
    <Modal.ModalBase
        onCancel={undefined} // intentionally NOT cancellable here, cancellable on the device only
        data-testid="@firmware-modal"
        heading={modalHeading}
    >
        <ThpPairingFailedForFirmwareInstallation />
    </Modal.ModalBase>
);
