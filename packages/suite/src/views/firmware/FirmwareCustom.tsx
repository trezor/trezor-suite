import { useState } from 'react';

import { useFirmwareDesktopUpdate } from '@suite/firmware-upgrade';
import { Translation } from '@suite/intl';

import { FirmwareLowBatteryModal } from 'src/components/firmware/FirmwareLowBatteryModal';
import { SelectCustomFirmware } from 'src/components/firmware/SelectCustomFirmware';

import { FirmwareModal } from './FirmwareModal';

export const FirmwareCustom = () => {
    const [firmwareBinary, setFirmwareBinary] = useState<ArrayBuffer>();
    const { firmwareUpdate, originalDevice, showLowBatteryModal, toggleLowBatteryModal } =
        useFirmwareDesktopUpdate();

    const installCustomFirmware = () => {
        if (firmwareBinary && originalDevice) {
            firmwareUpdate({ device: originalDevice, binary: firmwareBinary });
        }
    };

    if (showLowBatteryModal) {
        return <FirmwareLowBatteryModal onClose={toggleLowBatteryModal} />;
    }

    return (
        <FirmwareModal
            isCustomFirmwareUploaded={!!firmwareBinary}
            heading={<Translation id="TR_DEVICE_SETTINGS_CUSTOM_FIRMWARE_TITLE" />}
            install={installCustomFirmware}
        >
            <SelectCustomFirmware setFirmwareBinary={setFirmwareBinary} />
        </FirmwareModal>
    );
};
