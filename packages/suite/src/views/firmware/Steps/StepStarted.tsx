import { ReactNode } from 'react';

import { Modal } from '@trezor/components';

import { FirmwareInstallationStandalone } from '../../../components/firmware';

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
            <FirmwareInstallationStandalone
                install={install}
                onPromptClose={onPromptClose}
                isCustomFirmware={isCustomFirmware}
            />
        </Modal.ModalBase>
    );
};
