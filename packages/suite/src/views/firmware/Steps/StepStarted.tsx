import { type ReactNode } from 'react';

import { FirmwareInstallation } from '@suite/firmware';
import { Modal } from '@trezor/components';

type StepStartedProps = {
    onPromptClose: () => void;
    install: () => void;
    isCustomFirmwareUploaded?: boolean;
    modalHeading: ReactNode;
};

export const StepStarted = ({
    onPromptClose,
    modalHeading,
    isCustomFirmwareUploaded,
    install,
}: StepStartedProps) => {
    const isCustomFirmware = typeof isCustomFirmwareUploaded !== 'undefined';

    return (
        <Modal.ModalBase
            onCancel={undefined} // intentionally NOT cancellable here,  cancellable on the device only
            data-testid="@firmware-modal"
            heading={modalHeading}
        >
            <FirmwareInstallation
                install={install}
                onPromptClose={onPromptClose}
                isCustomFirmware={isCustomFirmware}
            />
        </Modal.ModalBase>
    );
};
