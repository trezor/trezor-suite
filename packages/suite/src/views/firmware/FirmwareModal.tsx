import { ReactNode, useState } from 'react';
import { useIntl } from 'react-intl';

import { useFirmwareInstallation } from '@suite-common/firmware';
import { acquireDevice, selectSelectedDevice } from '@suite-common/wallet-core';
import { Modal } from '@trezor/components';
import TrezorConnect from '@trezor/connect';
import { ConfirmOnDevice } from '@trezor/product-components';

import { closeModalApp } from 'src/actions/suite/routerActions';
import { Translation } from 'src/components/suite';
import { ThpAutoconnectModal, ThpConnectionModal } from 'src/components/suite/modals';
import { useDispatch, useSelector } from 'src/hooks/suite';
import messages from 'src/support/messages';

import { StepCheckSeed } from './Steps/StepCheckSeed';
import { StepDone } from './Steps/StepDone';
import { StepError } from './Steps/StepError';
import { StepInitial } from './Steps/StepInitial';
import { StepStarted } from './Steps/StepStarted';
import { StepThpFailed } from './Steps/StepThpFailed';
import { StepThpPairing } from './Steps/StepThpPairing';
import { StepThpStart } from './Steps/StepThpStart';

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

    const dispatch = useDispatch();
    const intl = useIntl();
    const [isChecked, setIsChecked] = useState(false);
    const uiEventDevice =
        uiEvent && 'device' in uiEvent.payload ? uiEvent.payload.device : undefined;

    const deviceModelInternal = uiEventDevice?.features?.internal_model;

    // The 'started' is NOT cancellable as the FW is streamed into the device.
    // It can be cancelled only via `trezorCancel`
    const isCancelable = ['initial', 'check-seed', 'done', 'error'].includes(status);

    const isAwaitingPinEntry =
        uiEvent?.type === 'button' && uiEvent.payload.code === 'ButtonRequest_PinEntry';

    const handleClose = () => {
        if (device?.status !== 'available') {
            dispatch(acquireDevice(device));
        }
        dispatch(closeModalApp());
        resetReducer();
    };

    const trezorCancel = () => TrezorConnect.cancel(intl.formatMessage(messages.TR_CANCELLED));

    const getContent = () => {
        console.log('____FirmwareModal::status', status);

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
            case 'thp-pairing-start':
                return <StepThpStart modalHeading={heading} />;
            case 'thp_pairing_request':
                return device !== undefined ? <ThpConnectionModal device={device} /> : null;
            case 'thp-pairing':
                return device !== undefined ? <StepThpPairing modalHeading={heading} /> : null;
            case 'thp_connection_request':
                return device !== undefined ? (
                    <ThpConnectionModal device={device} isAutoConnectAvailable />
                ) : null;
            case 'thp_autoconnect_credential_request':
                return device !== undefined ? <ThpAutoconnectModal device={device} /> : null;
            case 'thp-pairing-failed':
                return <StepThpFailed modalHeading={heading} />;
            case 'done':
                return (
                    <StepDone
                        modalHeading={heading}
                        install={install}
                        onClose={handleClose}
                        isCustomFirmwareUploaded={isCustomFirmwareUploaded}
                    />
                );
            default: {
                const _unhandledCase: never = status;
                throw new Error(`Unhandled status: ${_unhandledCase}`);
            }
        }
    };

    // Todo: this shall be handled without this ugly if
    if (
        status === 'thp_pairing_request' ||
        status === 'thp_connection_request' ||
        status === 'thp_autoconnect_credential_request'
    ) {
        return getContent();
    }

    return (
        <Modal.Backdrop onClick={isCancelable ? handleClose : undefined}>
            {showConfirmationPill && (
                <ConfirmOnDevice
                    title={<Translation id="TR_CONFIRM_ON_TREZOR" />}
                    deviceModelInternal={deviceModelInternal}
                    deviceUnitColor={uiEventDevice?.features?.unit_color}
                    isConfirmed={!confirmOnDevice}
                    onCancel={isAwaitingPinEntry ? trezorCancel : undefined}
                />
            )}
            {getContent()}
        </Modal.Backdrop>
    );
};
