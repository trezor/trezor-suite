import { type ReactNode } from 'react';

import { type TrezorDevice } from '@suite-common/suite-types';
import { Modal } from '@trezor/components';

import { FirmwareInstallation } from 'src/components/firmware/FirmwareInstallation';

type StepStartedProps = {
    device: TrezorDevice | undefined;
    onPromptClose: () => void;
    install: () => void;
    isCustomFirmwareUploaded?: boolean;
    modalHeading: ReactNode;
};

export const StepStarted = ({
    device,
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
                device={device}
                install={install}
                onPromptClose={onPromptClose}
                isCustomFirmware={isCustomFirmware}
            />
        </Modal.ModalBase>
    );
};
