import { useState } from 'react';

import { useFirmwareInstallation } from '@suite-common/firmware';

import { SelectCustomFirmware } from 'src/components/firmware';
import { Translation } from 'src/components/suite';

import { FirmwareModal } from './FirmwareModal';

export const FirmwareCustom = () => {
    const [firmwareBinary, setFirmwareBinary] = useState<ArrayBuffer>();
    const { firmwareUpdate } = useFirmwareInstallation();

    const installCustomFirmware = () => {
        if (firmwareBinary) {
            firmwareUpdate({ binary: firmwareBinary });
        }
    };

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
