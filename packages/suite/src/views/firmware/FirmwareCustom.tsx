import { useState } from 'react';

import { useFirmwareDesktopUpdate } from '@suite/firmware-upgrade';
import { Translation } from '@suite/intl';

import { SelectCustomFirmware } from 'src/components/firmware';
import { FirmwareLowBatteryModal } from 'src/components/firmware/FirmwareLowBatteryModal';

import { FirmwareModal } from './FirmwareModal';

export const FirmwareCustom = () => {
    const [firmwareBinary, setFirmwareBinary] = useState<ArrayBuffer>();
    const { firmwareUpdate, showLowBatteryModal, toggleLowBatteryModal } =
        useFirmwareDesktopUpdate();

    const installCustomFirmware = () => {
        if (firmwareBinary) {
            firmwareUpdate({ binary: firmwareBinary });
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
