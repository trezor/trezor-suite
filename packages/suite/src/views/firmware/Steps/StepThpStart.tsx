import { ReactNode } from 'react';

import { Modal } from '@trezor/components';

import { ThpPairingStart } from '../../../components/thp/ThpPairingStart';

type StepThpStartProps = {
    modalHeading: ReactNode;
};

export const StepThpStart = ({ modalHeading }: StepThpStartProps) => (
    <Modal.ModalBase
        onCancel={undefined} // intentionally NOT cancellable here,  cancellable on the device only
        data-testid="@firmware-modal"
        heading={modalHeading}
    >
        <ThpPairingStart />
    </Modal.ModalBase>
);
