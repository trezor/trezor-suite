import { ReactNode, useState } from 'react';
import { useIntl } from 'react-intl';

import { useFirmwareInstallation } from '@suite-common/firmware';
import {
    acquireDevice,
    selectDevices,
    selectIsDeviceBackedUp,
    selectSelectedDevice,
} from '@suite-common/wallet-core';
import { H3, NewModal, Paragraph, Tooltip } from '@trezor/components';
import TrezorConnect from '@trezor/connect';
import { ConfirmOnDevice } from '@trezor/product-components';

import { updateAnalytics } from 'src/actions/onboarding/onboardingActions';
import { closeModalApp, goto } from 'src/actions/suite/routerActions';
import { CheckSeedStep, FirmwareInstallationStandalone } from 'src/components/firmware';
import { PrerequisitesGuide, Translation } from 'src/components/suite';
import { useDispatch, useSelector } from 'src/hooks/suite';
import messages from 'src/support/messages';

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
    const devices = useSelector(selectDevices);
    const isDeviceBackedUp = useSelector(selectIsDeviceBackedUp);
    const dispatch = useDispatch();
    const intl = useIntl();
    const [isChecked, setIsChecked] = useState(false);

    const isCustomFirmware = typeof isCustomFirmwareUploaded !== 'undefined';
    const deviceModelInternal = uiEvent?.payload.device.features?.internal_model;
    const devicesConnected = devices.filter(device => device?.connected);
    const multipleDevicesConnected = [...new Set(devicesConnected.map(d => d.path))].length > 1;
    const shouldCheckSeed = device?.mode !== 'initialize';
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
    const handlePinCancel = () => TrezorConnect.cancel(intl.formatMessage(messages.TR_CANCELLED));

    const handleInstall = () => {
        install();
        updateAnalytics({ firmware: 'install' });
    };

    const getContent = () => {
        if (
            (!device?.connected || !device?.features) &&
            ['initial', 'check-seed'].includes(status)
        ) {
            return <PrerequisitesGuide />;
        }

        switch (status) {
            case 'error':
                return (
                    <>
                        <H3>
                            <Translation id="TR_FW_INSTALLATION_FAILED" />
                        </H3>
                        <Paragraph>
                            <Translation id="TOAST_GENERIC_ERROR" values={{ error: error || '' }} />
                        </Paragraph>
                    </>
                );
            case 'initial':
                return children;
            case 'check-seed':
                return (
                    <CheckSeedStep
                        deviceWillBeWiped={deviceWillBeWiped}
                        setIsChecked={setIsChecked}
                        isChecked={isChecked}
                    />
                );
            case 'started':
            case 'done':
                return (
                    <FirmwareInstallationStandalone
                        install={install}
                        onPromptClose={handleClose}
                        isCustomFirmware={isCustomFirmware}
                    />
                );
        }
    };

    const getBottomContent = () => {
        switch (status) {
            case 'error':
                return (
                    <NewModal.Button variant="tertiary" onClick={handleClose}>
                        <Translation id="TR_CLOSE" />
                    </NewModal.Button>
                );
            case 'initial':
                return (
                    <>
                        <Tooltip
                            content={<Translation id="TR_INSTALL_FW_DISABLED_MULTIPLE_DEVICES" />}
                            isActive={multipleDevicesConnected}
                        >
                            <NewModal.Button
                                onClick={() =>
                                    shouldCheckSeed ? setStatus('check-seed') : handleInstall()
                                }
                                data-testid="@firmware/install-button"
                                isDisabled={
                                    isCustomFirmware
                                        ? !isCustomFirmwareUploaded
                                        : multipleDevicesConnected
                                }
                            >
                                <Translation id={shouldCheckSeed ? 'TR_CONTINUE' : 'TR_INSTALL'} />
                            </NewModal.Button>
                        </Tooltip>
                        <NewModal.Button variant="tertiary" onClick={handleClose}>
                            <Translation id="TR_CANCEL" />
                        </NewModal.Button>
                    </>
                );
            case 'check-seed':
                return (
                    <>
                        <NewModal.Button
                            onClick={install}
                            data-testid="@firmware/confirm-seed-button"
                            isDisabled={!device?.connected || !isChecked}
                            variant={deviceWillBeWiped ? 'destructive' : 'primary'}
                        >
                            <Translation
                                id={deviceWillBeWiped ? 'TR_WIPE_AND_REINSTALL' : 'TR_INSTALL'}
                            />
                        </NewModal.Button>
                        <NewModal.Button
                            variant="tertiary"
                            onClick={() => {
                                resetReducer();
                                dispatch(
                                    goto(isDeviceBackedUp ? 'recovery-index' : 'backup-index'),
                                );
                            }}
                        >
                            <Translation
                                id={isDeviceBackedUp ? 'TR_CHECK_SEED' : 'TR_CREATE_BACKUP'}
                            />
                        </NewModal.Button>
                    </>
                );
            case 'done':
                return (
                    <NewModal.Button onClick={handleClose} data-testid="@firmware/continue-button">
                        <Translation id="TR_CLOSE" />
                    </NewModal.Button>
                );
            default:
                return null;
        }
    };

    return (
        <NewModal.Backdrop onClick={isCancelable ? handleClose : undefined}>
            {showConfirmationPill && (
                <ConfirmOnDevice
                    title={<Translation id="TR_CONFIRM_ON_TREZOR" />}
                    deviceModelInternal={deviceModelInternal}
                    deviceUnitColor={uiEvent?.payload.device.features?.unit_color}
                    isConfirmed={!confirmOnDevice}
                    onCancel={isAwaitingPinEntry ? handlePinCancel : undefined}
                />
            )}
            <NewModal.ModalBase
                onCancel={isCancelable ? handleClose : undefined}
                data-testid="@firmware-modal"
                heading={status === 'error' ? undefined : heading}
                bottomContent={getBottomContent()}
                iconName={status === 'error' ? 'warning' : undefined}
                variant={status === 'error' ? 'destructive' : undefined}
            >
                {getContent()}
            </NewModal.ModalBase>
        </NewModal.Backdrop>
    );
};
