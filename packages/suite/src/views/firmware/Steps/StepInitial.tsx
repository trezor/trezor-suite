import { ReactNode } from 'react';

import { FirmwareStatus } from '@suite-common/suite-types';
import { selectDevices, selectSelectedDevice } from '@suite-common/wallet-core';
import { Modal, Tooltip } from '@trezor/components';

import { updateAnalytics } from '../../../actions/onboarding/onboardingActions';
import { PrerequisitesGuide, Translation } from '../../../components/suite';
import { useSelector } from '../../../hooks/suite';

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
    const device = useSelector(selectSelectedDevice);

    const devices = useSelector(selectDevices);
    const devicesConnected = devices.filter(device => device?.connected);
    const multipleDevicesConnected = [...new Set(devicesConnected.map(d => d.path))].length > 1;
    const shouldCheckSeed = device?.mode !== 'initialize';

    if (!device?.connected || !device?.features) {
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
                    <Modal.Button variant="tertiary" onClick={onClose}>
                        <Translation id="TR_CANCEL" />
                    </Modal.Button>
                </>
            }
        >
            {children}
        </Modal.ModalBase>
    );
};
