import { ReactNode } from 'react';

import { Modal } from '@trezor/components';

import { FirmwareInstallationStandalone } from '../../../components/firmware';
import { Translation } from '../../../components/suite';

type StepDoneProps = {
    onClose: () => void;
    install: () => void;
    isCustomFirmwareUploaded?: boolean;
    modalHeading: ReactNode;
};

export const StepDone = ({
    onClose,
    modalHeading,
    isCustomFirmwareUploaded,
    install,
}: StepDoneProps) => {
    const isCustomFirmware = typeof isCustomFirmwareUploaded !== 'undefined';

    return (
        <Modal.ModalBase
            onCancel={onClose}
            data-testid="@firmware-modal"
            heading={modalHeading}
            bottomContent={
                <Modal.Button onClick={onClose} data-testid="@firmware/continue-button">
                    <Translation id="TR_CLOSE" />
                </Modal.Button>
            }
        >
            <FirmwareInstallationStandalone
                install={install}
                onPromptClose={onClose}
                isCustomFirmware={isCustomFirmware}
            />
        </Modal.ModalBase>
    );
};
