import {
    FirmwareInitial,
    FirmwareLowBatteryModal,
    useFirmwareDesktopUpdate,
} from '@suite/firmware';
import { Translation } from '@suite/intl';
import { FirmwareType } from '@trezor/connect';

import { FirmwareModal } from './FirmwareModal';

export const FirmwareUpdate = () => {
    const {
        firmwareUpdate,
        switchFirmwareType,
        targetFirmwareType,
        showLowBatteryModal,
        toggleLowBatteryModal,
    } = useFirmwareDesktopUpdate();

    const installTargetFirmware = () =>
        firmwareUpdate({
            firmwareType: targetFirmwareType,
        });

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
        <FirmwareModal heading={heading} install={installTargetFirmware}>
            <FirmwareInitial />
        </FirmwareModal>
    );
};
