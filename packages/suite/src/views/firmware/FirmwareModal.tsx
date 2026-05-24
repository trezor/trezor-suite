import { type ReactNode, useCallback, useEffect, useRef, useState } from 'react';

import {
    useFirmwareDesktopUpdate,
    useFirmwareInstallationProgressCheck,
} from '@suite/firmware-upgrade';
import { closeModal } from '@suite/modal';
import { closeModalApp } from '@suite/router';
import { ThpPairingStep } from '@suite/thp';
import { selectSelectedDevice } from '@suite-common/device';
import { notificationsActions } from '@suite-common/toast-notifications';
import { acquireDevice } from '@suite-common/wallet-core';
import { Modal } from '@trezor/components';
import { exhaustive } from '@trezor/type-utils';

import { FirmwareInstallationProgressCheck } from 'src/components/firmware/ProgressCheck/FirmwareInstallationProgressCheck';
import { useDispatch, useSelector } from 'src/hooks/suite';

import { StepCheckSeed } from './Steps/StepCheckSeed';
import { StepDone } from './Steps/StepDone';
import { StepError } from './Steps/StepError';
import { StepInitial } from './Steps/StepInitial';
import { StepStarted } from './Steps/StepStarted';

const AUTO_CLOSE_AFTER_DONE_MS = 2000;

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

    const handleClose = useCallback(() => {
        if (device?.status !== 'available') {
            dispatch(acquireDevice({ requestedDevice: device }));
        }
        dispatch(closeModal());
        dispatch(closeModalApp());
        resetReducer();
    }, [device, dispatch, resetReducer]);

    const handleCloseRef = useRef(handleClose);
    handleCloseRef.current = handleClose;

    useEffect(() => {
        if (status !== 'done') return;

        dispatch(notificationsActions.addToast({ type: 'firmware-update-success' }));
        const timeoutId = setTimeout(() => handleCloseRef.current(), AUTO_CLOSE_AFTER_DONE_MS);

        return () => clearTimeout(timeoutId);
    }, [status, dispatch]);

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
