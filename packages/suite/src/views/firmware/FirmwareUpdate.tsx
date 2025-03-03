import { useFirmwareInstallation } from '@suite-common/firmware';
import { FirmwareType } from '@trezor/connect';

import { FirmwareInitialStandalone } from 'src/components/firmware';
import { Translation } from 'src/components/suite';

import { FirmwareModal } from './FirmwareModal';

type FirmwareUpdateProps = {
    shouldSwitchFirmwareType?: boolean;
};

export const FirmwareUpdate = ({ shouldSwitchFirmwareType }: FirmwareUpdateProps) => {
    const { firmwareUpdate, targetFirmwareType } = useFirmwareInstallation({
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

    return (
        <FirmwareModal
            shouldSwitchFirmwareType={shouldSwitchFirmwareType}
            heading={heading}
            install={installTargetFirmware}
        >
            <FirmwareInitialStandalone shouldSwitchFirmwareType={shouldSwitchFirmwareType} />
        </FirmwareModal>
    );
};
