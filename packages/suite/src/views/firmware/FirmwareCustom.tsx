import { useState } from 'react';

import { adoptFirmwareUpdatedDeviceThunk, useFirmwareDesktopUpdate } from '@suite/firmware-upgrade';
import { Translation } from '@suite/intl';
import { useDispatch } from '@suite-common/redux-utils';

import { FirmwareLowBatteryModal } from 'src/components/firmware/FirmwareLowBatteryModal';
import { SelectCustomFirmware } from 'src/components/firmware/SelectCustomFirmware';

import { FirmwareModal } from './FirmwareModal';

export const FirmwareCustom = () => {
    const [firmwareBinary, setFirmwareBinary] = useState<ArrayBuffer>();
    const dispatch = useDispatch();
    const { firmwareUpdate, originalDevice, showLowBatteryModal, toggleLowBatteryModal } =
        useFirmwareDesktopUpdate({
            // Standalone: the device is Suite's again once the update is done, so hand it back.
            onUpdateFinished: device => dispatch(adoptFirmwareUpdatedDeviceThunk({ device })),
        });

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
