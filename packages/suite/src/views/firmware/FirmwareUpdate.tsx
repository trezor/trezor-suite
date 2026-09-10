import {
    FirmwareUpdateSession,
    adoptFirmwareUpdatedDeviceThunk,
    useFirmwareDesktopUpdate,
    useLatchedDevice,
} from '@suite/firmware-upgrade';
import { Translation } from '@suite/intl';
import { selectSelectedDevice } from '@suite-common/device';
import { useDispatch } from '@suite-common/redux-utils';
import { FirmwareType } from '@trezor/connect';

import { FirmwareInitial } from 'src/components/firmware/FirmwareInitial';
import { FirmwareLowBatteryModal } from 'src/components/firmware/FirmwareLowBatteryModal';
import { useSelector } from 'src/hooks/suite';

import { FirmwareModal } from './FirmwareModal';

export const FirmwareUpdate = () => {
    const dispatch = useDispatch();
    // Latched here, so the device this flow installs onto and the device it hands to the session
    // are the same one — the update takes it out of the device list and the selection moves on.
    const device = useLatchedDevice(useSelector(selectSelectedDevice));
    const {
        firmwareUpdate,
        switchFirmwareType,
        targetFirmwareType,
        showLowBatteryModal,
        toggleLowBatteryModal,
    } = useFirmwareDesktopUpdate({
        // Standalone: the device is Suite's again once the update is done, so hand it back.
        onUpdateFinished: device => dispatch(adoptFirmwareUpdatedDeviceThunk({ device })),
    });

    const installTargetFirmware = () => {
        if (!device) {
            return;
        }

        firmwareUpdate({ device, firmwareType: targetFirmwareType });
    };

    const heading = switchFirmwareType ? (
        <Translation
            id="TR_SWITCH_FIRMWARE_TO"
            values={{
                firmwareType: (
                    <Translation
                        id={
                            targetFirmwareType === FirmwareType.BitcoinOnly
                                ? 'TR_FIRMWARE_TYPE_BITCOIN_ONLY'
                                : 'TR_FIRMWARE_TYPE_REGULAR'
                        }
                    />
                ),
            }}
        />
    ) : (
        <Translation id="TR_INSTALL_FIRMWARE" />
    );

    if (showLowBatteryModal) {
        return <FirmwareLowBatteryModal onClose={toggleLowBatteryModal} />;
    }

    return (
        <FirmwareUpdateSession device={device}>
            <FirmwareModal heading={heading} install={installTargetFirmware}>
                <FirmwareInitial />
            </FirmwareModal>
        </FirmwareUpdateSession>
    );
};
