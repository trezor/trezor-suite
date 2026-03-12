import { ReactNode, useState } from 'react';

import { closeModal } from '@suite/modal';
import { closeModalApp } from '@suite/router';
import { selectSelectedDevice } from '@suite-common/device';
import { acquireDevice } from '@suite-common/wallet-core';
import { Modal } from '@trezor/components';
import { exhaustive } from '@trezor/type-utils';

import { ThpPairingStep } from 'src/components/firmware/ThpPairingStep/ThpPairingStep';
import { useDispatch, useFirmwareInstallationProgressCheck, useSelector } from 'src/hooks/suite';
import { useFirmwareDesktopUpdate } from 'src/hooks/suite/useFirmwareDesktopUpdate';

import { StepCheckSeed } from './Steps/StepCheckSeed';
import { StepDone } from './Steps/StepDone';
import { StepError } from './Steps/StepError';
import { StepInitial } from './Steps/StepInitial';
import { StepStarted } from './Steps/StepStarted';
import { FirmwareInstallationProgressCheck } from '../../components/firmware';

type FirmwareModalProps = {
    children: ReactNode;
    heading: ReactNode;
    install: () => void;
    isCustomFirmwareUploaded?: boolean;
};

export const FirmwareModal = ({
    children,
    heading,
    install,
    isCustomFirmwareUploaded,
}: FirmwareModalProps) => {
    const { resetReducer, status, setStatus, deviceWillBeWiped, error } =
        useFirmwareDesktopUpdate();
    const device = useSelector(selectSelectedDevice);

    const dispatch = useDispatch();
    const [isChecked, setIsChecked] = useState(false);
    const { isProgressCheckDisplayed, handleDismissProgressCheck } =
        useFirmwareInstallationProgressCheck();

    // The 'started' is NOT cancellable as the FW is streamed into the device.
    // It can be canceled only via `trezorCancel`
    const isCancelable = ['initial', 'check-seed', 'done', 'error'].includes(status);

    const handleClose = () => {
        if (device?.status !== 'available') {
            dispatch(acquireDevice({ requestedDevice: device }));
        }
        dispatch(closeModal());
        dispatch(closeModalApp());
        resetReducer();
    };

    const getContent = () => {
        switch (status) {
            case 'error':
                return <StepError error={error} onClose={handleClose} />;
            case 'initial':
                return (
                    <StepInitial
                        onClose={handleClose}
                        install={install}
                        setStatus={setStatus}
                        isCustomFirmwareUploaded={isCustomFirmwareUploaded}
                        modalHeading={heading}
                    >
                        {children}
                    </StepInitial>
                );
            case 'check-seed':
                return (
                    <StepCheckSeed
                        resetReducer={resetReducer}
                        onClose={handleClose}
                        deviceWillBeWiped={deviceWillBeWiped}
                        setIsChecked={setIsChecked}
                        isChecked={isChecked}
                        modalHeading={heading}
                        install={install}
                    />
                );
            case 'started':
                if (isProgressCheckDisplayed) {
                    return (
                        <Modal width={760}>
                            <FirmwareInstallationProgressCheck
                                handleDismiss={handleDismissProgressCheck}
                            />
                        </Modal>
                    );
                }

                return (
                    <StepStarted
                        modalHeading={heading}
                        install={install}
                        onPromptClose={handleClose}
                        isCustomFirmwareUploaded={isCustomFirmwareUploaded}
                    />
                );
            case 'thp-pairing':
                return <ThpPairingStep heading={heading} />;

            case 'done':
                return (
                    <StepDone
                        modalHeading={heading}
                        install={install}
                        onClose={handleClose}
                        isCustomFirmwareUploaded={isCustomFirmwareUploaded}
                    />
                );
            default:
                exhaustive(status);
        }
    };

    return (
        <Modal.Backdrop onClick={isCancelable ? handleClose : undefined}>
            {getContent()}
        </Modal.Backdrop>
    );
};
