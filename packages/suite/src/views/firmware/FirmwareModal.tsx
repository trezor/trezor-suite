import { ReactNode, useState } from 'react';
import { useIntl } from 'react-intl';

import { useFirmwareInstallation } from '@suite-common/firmware';
import { getDeviceColorVariant, getDeviceInternalModel } from '@suite-common/suite-utils';
import { selectThpStep } from '@suite-common/thp';
import { acquireDevice, selectSelectedDevice } from '@suite-common/wallet-core';
import { Modal } from '@trezor/components';
import TrezorConnect from '@trezor/connect';
import { ConfirmOnDevice } from '@trezor/product-components';
import { exhaustive } from '@trezor/type-utils';

import { closeModalApp } from 'src/actions/suite/routerActions';
import { Translation } from 'src/components/suite';
import { useDispatch, useSelector } from 'src/hooks/suite';
import messages from 'src/support/messages';

import { StepCheckSeed } from './Steps/StepCheckSeed';
import { StepDone } from './Steps/StepDone';
import { StepError } from './Steps/StepError';
import { StepInitial } from './Steps/StepInitial';
import { StepStarted } from './Steps/StepStarted';
import { StepThpFailed } from './Steps/StepThpFailed';
import { StepThpPairing } from './Steps/StepThpPairing';
import { StepThpPairingRequest } from './Steps/StepThpPairingRequest';
import { StepThpStart } from './Steps/StepThpStart';
import * as modalActions from '../../actions/suite/modalActions';

type FirmwareModalProps = {
    children: ReactNode;
    heading: ReactNode;
    install: () => void;
    isCustomFirmwareUploaded?: boolean;
    shouldSwitchFirmwareType?: boolean;
};

export const FirmwareModal = ({
    children,
    heading,
    install,
    isCustomFirmwareUploaded,
    shouldSwitchFirmwareType,
}: FirmwareModalProps) => {
    const {
        resetReducer,
        status,
        setStatus,
        deviceWillBeWiped,
        error,
        uiEvent,
        confirmOnDevice,
        showConfirmationPill,
    } = useFirmwareInstallation({ shouldSwitchFirmwareType });
    const device = useSelector(selectSelectedDevice);

    const thpStep = useSelector(selectThpStep);

    const dispatch = useDispatch();
    const intl = useIntl();
    const [isChecked, setIsChecked] = useState(false);
    const uiEventDevice =
        uiEvent && 'device' in uiEvent.payload ? uiEvent.payload.device : undefined;

    // The 'started' is NOT cancellable as the FW is streamed into the device.
    // It can be canceled only via `trezorCancel`
    const isCancelable = ['initial', 'check-seed', 'done', 'error'].includes(status);

    const isAwaitingPinEntry =
        uiEvent?.type === 'button' && uiEvent.payload.code === 'ButtonRequest_PinEntry';

    const handleClose = () => {
        if (device?.status !== 'available') {
            dispatch(acquireDevice({ requestedDevice: device }));
        }
        dispatch(modalActions.onCancel());
        dispatch(closeModalApp());
        resetReducer();
    };

    const trezorCancel = () => TrezorConnect.cancel(intl.formatMessage(messages.TR_CANCELLED));

    const getContent = () => {
        if (thpStep !== null) {
            switch (thpStep) {
                case 'BeforeConnectionInfo':
                    return <StepThpStart modalHeading={heading} />;
                case 'ConfirmConnectionBeforePairing':
                case 'ConfirmOnlyConnection':
                    return device !== undefined ? (
                        <StepThpPairingRequest modalHeading={heading} />
                    ) : null;
                case 'CodeEntry':
                    return device !== undefined ? <StepThpPairing modalHeading={heading} /> : null;

                // Auto-connect not relevant for Firmware Installation.
                // We don't want to ask the user for autoconnect during FW installation, instead we
                // postpone it for the next connection.
                case 'AutoconnectInfo':
                case 'Autoconnect':
                    return null;

                case 'CodeInvalid':
                    return <StepThpFailed modalHeading={heading} />;

                default:
                    exhaustive(thpStep);
            }
        }

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
                return (
                    <StepStarted
                        modalHeading={heading}
                        install={install}
                        onPromptClose={handleClose}
                        isCustomFirmwareUploaded={isCustomFirmwareUploaded}
                    />
                );
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
            {showConfirmationPill && (
                <ConfirmOnDevice
                    title={<Translation id="TR_CONFIRM_ON_TREZOR" />}
                    deviceModelInternal={
                        uiEventDevice !== undefined
                            ? getDeviceInternalModel(uiEventDevice)
                            : undefined
                    }
                    deviceUnitColor={
                        uiEventDevice !== undefined
                            ? getDeviceColorVariant(uiEventDevice)
                            : undefined
                    }
                    isConfirmed={!confirmOnDevice}
                    onCancel={isAwaitingPinEntry ? trezorCancel : undefined}
                />
            )}
            {getContent()}
        </Modal.Backdrop>
    );
};
