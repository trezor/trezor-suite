import { useState } from 'react';

import { useFirmwareInstallation } from '@suite-common/firmware';

import { useDevice } from 'src/hooks/suite';
import { SelectCustomFirmware } from 'src/components/firmware';

import { FirmwareModal } from './FirmwareModal';

export const FirmwareCustom = () => {
    const [firmwareBinary, setFirmwareBinary] = useState<ArrayBuffer>();
    const { setStatus, firmwareUpdate } = useFirmwareInstallation();
    const { device } = useDevice();

    const installCustomFirmware = () => {
        if (firmwareBinary) {
            firmwareUpdate({ binary: firmwareBinary });
        }
    };
    const continueFromSelection = () => {
        // If there is no firmware installed or device is not initialized, check-seed step can be skipped.
        if (device?.firmware === 'none' || device?.mode === 'initialize') {
            installCustomFirmware();
        } else {
            setStatus('check-seed');
        }
    };

    return (
        <FirmwareModal
            isCustom
            heading="TR_DEVICE_SETTINGS_CUSTOM_FIRMWARE_TITLE"
            install={installCustomFirmware}
        >
            <SelectCustomFirmware
                install={continueFromSelection}
                setFirmwareBinary={setFirmwareBinary}
                isUploaded={!!firmwareBinary}
            />
        </FirmwareModal>
    );
};
