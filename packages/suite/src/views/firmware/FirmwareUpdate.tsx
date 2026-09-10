import {
    FirmwareUpdateSession,
    adoptFirmwareUpdatedDeviceThunk,
    useFirmwareDesktopUpdate,
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
    // The device the flow opens on. The session latches it, so it survives the update taking the
    // device out of the list and the selection moving on.
    const device = useSelector(selectSelectedDevice);
    const {
        firmwareUpdate,
        originalDevice,
        switchFirmwareType,
        targetFirmwareType,
        showLowBatteryModal,
        toggleLowBatteryModal,
    } = useFirmwareDesktopUpdate({
        // Standalone: the device is Suite's again once the update is done, so hand it back.
        onUpdateFinished: device => dispatch(adoptFirmwareUpdatedDeviceThunk({ device })),
    });

    // `originalDevice` is the device as it was before the update: the live one on the first
    // attempt, the cached pre-update one on a retry, where the device is already in bootloader
    // mode and no longer reports its id.
    const installTargetFirmware = () => {
        if (!originalDevice) {
            return;
        }

        firmwareUpdate({
            device: originalDevice,
            firmwareType: targetFirmwareType,
        });
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
