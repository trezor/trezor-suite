import { type ReactNode } from 'react';

import { Translation } from '@suite/intl';
import { selectConnectedDevices } from '@suite-common/device';
import { selectFirmwareOriginalDevice } from '@suite-common/firmware';
import { type FirmwareStatus } from '@suite-common/suite-types';
import { Modal, Tooltip } from '@trezor/components';
import { unique } from '@trezor/utils';

import { updateAnalytics } from 'src/actions/onboarding/onboardingActions';
import { PrerequisitesGuide } from 'src/components/suite';
import { useSelector } from 'src/hooks/suite';

type StepInitialProps = {
    onClose: () => void;
    children: ReactNode;
    setStatus: (status: FirmwareStatus | 'error') => void;
    install: () => void;
    isCustomFirmwareUploaded?: boolean;
    modalHeading: ReactNode;
};

export const StepInitial = ({
    onClose,
    children,
    setStatus,
    install,
    isCustomFirmwareUploaded,
    modalHeading,
}: StepInitialProps) => {
    const firmwareUpdateDevice = useSelector(selectFirmwareOriginalDevice);

    const connectedDevices = useSelector(selectConnectedDevices);
    const multipleDevicesConnected = unique(connectedDevices.map(d => d.path)).length > 1;
    const shouldCheckSeed = firmwareUpdateDevice?.mode !== 'initialize';

    if (!firmwareUpdateDevice?.connected || !firmwareUpdateDevice?.features) {
        return <PrerequisitesGuide />;
    }

    const handleInstall = () => {
        install();
        updateAnalytics({ firmware: 'install' });
    };

    const isCustomFirmware = typeof isCustomFirmwareUploaded !== 'undefined';

    return (
        <Modal.ModalBase
            onCancel={onClose}
            data-testid="@firmware-modal"
            heading={modalHeading}
            bottomContent={
                <>
                    <Tooltip
                        content={<Translation id="TR_INSTALL_FW_DISABLED_MULTIPLE_DEVICES" />}
                        isActive={multipleDevicesConnected}
                    >
                        <Modal.Button
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
                        </Modal.Button>
                    </Tooltip>
                    <Modal.Button intent="neutral" priority="secondary" onClick={onClose}>
                        <Translation id="TR_CANCEL" />
                    </Modal.Button>
                </>
            }
        >
            {children}
        </Modal.ModalBase>
    );
};
