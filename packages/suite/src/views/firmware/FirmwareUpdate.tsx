import { FirmwareType } from '@trezor/connect';

import { FirmwareInitial } from 'src/components/firmware';
import { FirmwareLowBatteryModal } from 'src/components/firmware/FirmwareLowBatteryModal';
import { Translation } from 'src/components/suite/Translation';
import { useFirmwareDesktopUpdate } from 'src/hooks/suite/useFirmwareDesktopUpdate';

import { FirmwareModal } from './FirmwareModal';

type FirmwareUpdateProps = {
    shouldSwitchFirmwareType?: boolean;
};

export const FirmwareUpdate = ({ shouldSwitchFirmwareType }: FirmwareUpdateProps) => {
    const { firmwareUpdate, targetFirmwareType, showLowBatteryModal, toggleLowBatteryModal } =
        useFirmwareDesktopUpdate({
            shouldSwitchFirmwareType,
        });

    const installTargetFirmware = () =>
        firmwareUpdate({
            firmwareType: targetFirmwareType,
        });

    const heading = shouldSwitchFirmwareType ? (
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
        <FirmwareModal
            shouldSwitchFirmwareType={shouldSwitchFirmwareType}
            heading={heading}
            install={installTargetFirmware}
        >
            <FirmwareInitial shouldSwitchFirmwareType={shouldSwitchFirmwareType} />
        </FirmwareModal>
    );
};
