import { selectDevices, selectSelectedDevice } from '@suite-common/wallet-core';

import { PrerequisitesGuide } from 'src/components/suite';
import { selectShouldDisplayDeviceCompromised } from 'src/components/suite/Preloader/selectShouldDisplayDeviceCompromised';
import { DeviceCompromised } from 'src/components/suite/SecurityCheck/DeviceCompromised';
import { useSelector } from 'src/hooks/suite';
import { selectPrerequisite } from 'src/selectors/suite/suiteSelectors';

import { ModalSwitcher } from '../../components/suite/modals/ModalSwitcher/ModalSwitcher';
import { SecurityCheck } from '../onboarding/steps/SecurityCheck/SecurityCheck';

export const StartContent = ({ children }: { children: React.ReactNode }) => {
    const prerequisite = useSelector(selectPrerequisite);
    const devices = useSelector(selectDevices);
    const everyDeviceConnected = devices.every(
        device => device.connected || (!device.connected && device.remember),
    );

    const shouldDisplayDeviceCompromised = useSelector(selectShouldDisplayDeviceCompromised);
    const selectedDevice = useSelector(selectSelectedDevice);

    if (shouldDisplayDeviceCompromised) {
        return <DeviceCompromised />;
    }

    if (!everyDeviceConnected) {
        return <PrerequisitesGuide allowSwitchDevice />;
    }

    if (
        prerequisite &&
        !['device-initialize', 'firmware-missing', 'device-recovery-mode'].includes(prerequisite) &&
        !selectedDevice?.remember // NOTE: prevents flashing as there is a bootloader mode breefly there, as the device is disconnected
    ) {
        return (
            <>
                <ModalSwitcher />
                <PrerequisitesGuide />
            </>
        );
    }

    if (
        selectedDevice?.mode === 'initialize' ||
        (selectedDevice?.mode === 'bootloader' &&
            selectedDevice?.features &&
            selectedDevice?.features.firmware_present === false)
    ) {
        return <SecurityCheck />;
    }

    return children;
};
