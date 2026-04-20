import { useState } from 'react';

import {
    FirmwareLowBatteryModal,
    SelectCustomFirmware,
    useFirmwareDesktopUpdate,
} from '@suite/firmware';
import { Translation } from '@suite/intl';

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
