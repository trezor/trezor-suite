import { ReactNode } from 'react';

import { Modal } from '@trezor/components';

import { Translation } from '../../../components/suite';
import { ThpPairingPinEntry } from '../../../components/thp/ThpPairingPinEntry';

type StepThpPairingProps = {
    modalHeading: ReactNode;
};

export const StepThpPairing = ({ modalHeading }: StepThpPairingProps) => (
    <Modal.ModalBase
        onCancel={undefined} // intentionally NOT cancellable here,  cancellable on the device only
        data-testid="@firmware-modal"
        heading={modalHeading}
    >
        <ThpPairingPinEntry heading={<Translation id="TR_THP_ENTER_ONE_TIME_CODE" />} />
    </Modal.ModalBase>
);
