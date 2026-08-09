import { useState } from 'react';

import { useFirmwareDesktopUpdate } from '@suite/firmware-upgrade';
import { Translation } from '@suite/intl';
import { selectRouterParams } from '@suite/router';

import { FirmwareLowBatteryModal } from 'src/components/firmware/FirmwareLowBatteryModal';
import { SelectCustomFirmware } from 'src/components/firmware/SelectCustomFirmware';
import { SelectSuiteDarkFirmware } from 'src/components/firmware/SelectSuiteDarkFirmware';
import { useSelector } from 'src/hooks/suite';

import { FirmwareModal } from './FirmwareModal';

export const FirmwareCustom = () => {
    const [firmwareBinary, setFirmwareBinary] = useState<ArrayBuffer>();
    const { firmwareUpdate, showLowBatteryModal, toggleLowBatteryModal } =
        useFirmwareDesktopUpdate();

    // Suite Dark flavour: the same route serves the generic "custom firmware" upload
    // and the dedicated "install Suite Dark firmware" flow (which auto-downloads the
    // unofficial firmware-dark build and shows the wipe / unofficial warning).
    const params = useSelector(selectRouterParams);
    const isSuiteDark = params?.variant === 'suitedark';

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
            heading={
                <Translation
                    id={
                        isSuiteDark
                            ? 'TR_SUITE_DARK_FIRMWARE_TITLE'
                            : 'TR_DEVICE_SETTINGS_CUSTOM_FIRMWARE_TITLE'
                    }
                />
            }
            install={installCustomFirmware}
        >
            {isSuiteDark ? (
                <SelectSuiteDarkFirmware setFirmwareBinary={setFirmwareBinary} />
            ) : (
                <SelectCustomFirmware setFirmwareBinary={setFirmwareBinary} />
            )}
        </FirmwareModal>
    );
};
