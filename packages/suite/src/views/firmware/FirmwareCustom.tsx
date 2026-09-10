import { useState } from 'react';

import {
    FirmwareUpdateSession,
    adoptFirmwareUpdatedDeviceThunk,
    useFirmwareDesktopUpdate,
    useLatchedDevice,
} from '@suite/firmware-upgrade';
import { Translation } from '@suite/intl';
import { selectSelectedDevice } from '@suite-common/device';
import { useDispatch } from '@suite-common/redux-utils';

import { FirmwareLowBatteryModal } from 'src/components/firmware/FirmwareLowBatteryModal';
import { SelectCustomFirmware } from 'src/components/firmware/SelectCustomFirmware';
import { useSelector } from 'src/hooks/suite';

import { FirmwareModal } from './FirmwareModal';

export const FirmwareCustom = () => {
    const [firmwareBinary, setFirmwareBinary] = useState<ArrayBuffer>();
    // See `FirmwareUpdate`: latched, so the install target and the session's device are the same.
    const device = useLatchedDevice(useSelector(selectSelectedDevice));
    const dispatch = useDispatch();
    const { firmwareUpdate, showLowBatteryModal, toggleLowBatteryModal } = useFirmwareDesktopUpdate(
        {
            // Standalone: the device is Suite's again once the update is done, so hand it back.
            onUpdateFinished: device => dispatch(adoptFirmwareUpdatedDeviceThunk({ device })),
        },
    );

    const installCustomFirmware = () => {
        if (firmwareBinary && device) {
            firmwareUpdate({ device, binary: firmwareBinary });
        }
    };

    if (showLowBatteryModal) {
        return <FirmwareLowBatteryModal onClose={toggleLowBatteryModal} />;
    }

    return (
        <FirmwareUpdateSession device={device}>
            <FirmwareModal
                isCustomFirmwareUploaded={!!firmwareBinary}
                heading={<Translation id="TR_DEVICE_SETTINGS_CUSTOM_FIRMWARE_TITLE" />}
                install={installCustomFirmware}
            >
                <SelectCustomFirmware setFirmwareBinary={setFirmwareBinary} />
            </FirmwareModal>
        </FirmwareUpdateSession>
    );
};
