import { ReactNode } from 'react';

import { Modal } from '@trezor/components';

import { FirmwareInstallation } from '../../../components/firmware';
import { Translation } from '../../../components/suite/Translation';

type StepDoneProps = {
    onClose: () => void;
    install: () => void;
    isCustomFirmwareUploaded?: boolean;
    modalHeading: ReactNode;
    shouldSwitchFirmwareType: boolean;
};

export const StepDone = ({
    onClose,
    modalHeading,
    isCustomFirmwareUploaded,
    shouldSwitchFirmwareType,
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
            <FirmwareInstallation
                install={install}
                onPromptClose={onClose}
                isCustomFirmware={isCustomFirmware}
                shouldSwitchFirmwareType={shouldSwitchFirmwareType}
            />
        </Modal.ModalBase>
    );
};
