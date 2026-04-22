import { useDevice } from '@suite/device';
import {
    FirmwareWarningsList,
    FirmwareWipeWarning,
    useFirmwareDesktopUpdate,
} from '@suite/firmware-upgrade';
import { Translation } from '@suite/intl';
import { getFwUpdateVersion } from '@suite-common/suite-utils';
import { Banner, Card, Column } from '@trezor/components';
import { FirmwareType } from '@trezor/connect';
import { getFirmwareVersion } from '@trezor/device-utils';

import { FirmwareOffer } from 'src/components/firmware';

type GetDescriptionProps = {
    required: boolean;
    reinstall: boolean;
    targetType: FirmwareType;
    isBitcoinOnlyAvailable?: boolean;
    switchFirmwareType?: boolean;
};

const getDescription = ({
    required,
    reinstall,
    targetType,
    switchFirmwareType,
    isBitcoinOnlyAvailable,
}: GetDescriptionProps) => {
    if (switchFirmwareType) {
        if (!isBitcoinOnlyAvailable) {
            return 'TR_BITCOIN_ONLY_UNAVAILABLE';
        }

        return targetType === FirmwareType.BitcoinOnly
            ? 'TR_SWITCH_TO_BITCOIN_ONLY_DESCRIPTION'
            : 'TR_SWITCH_TO_REGULAR_DESCRIPTION';
    }

    if (required) {
        return 'TR_FIRMWARE_UPDATE_REQUIRED_EXPLAINED';
    }

    return reinstall ? 'TR_FIRMWARE_REINSTALL_FW_DESCRIPTION' : 'TR_FIRMWARE_NEW_FW_DESCRIPTION';
};

export const FirmwareInitial = () => {
    const { device } = useDevice();
    const { deviceWillBeWiped, switchFirmwareType, targetFirmwareType } =
        useFirmwareDesktopUpdate();

    // Just to satisfy TS, disconnected device should be handled upstream.
    if (!device?.connected || !device?.features) {
        return null;
    }

    // Bitcoin-only firmware is only available on T2T1 from v2.0.8 - older devices must first upgrade to 2.1.1 which does not have a Bitcoin-only variant
    const isBitcoinOnlyAvailable = !!device.firmwareReleaseConfigInfo?.isBitcoinOnlyAvailable;
    const currentFwVersion = getFirmwareVersion(device);
    const availableFwVersion = getFwUpdateVersion(device);
    const hasLatestAvailableFw = !!(
        availableFwVersion &&
        currentFwVersion &&
        availableFwVersion === currentFwVersion
    );

    return (
        <Column gap={16}>
            <Banner
                intent="info"
                icon="info"
                description={
                    <Translation
                        id={getDescription({
                            /**
                             * `device.firmware` is status of the firmware currently installed on the device.
                             *  available values: 'valid' | 'outdated' | 'required' | 'unknown' | 'none'
                             *
                             *  `device.firmwareReleaseConfigInfo` on the other hand contains latest available firmware to update to
                             *   (it is whatever returns getInfo() method from connect)
                             *   so it should not be used here.
                             */
                            required: device.firmware === 'required',
                            reinstall: device.firmware === 'valid' || hasLatestAvailableFw,
                            targetType: targetFirmwareType,
                            switchFirmwareType,
                            isBitcoinOnlyAvailable,
                        })}
                        values={{
                            bitcoinOnly: <Translation id="TR_FIRMWARE_TYPE_BITCOIN_ONLY" />,
                            regular: <Translation id="TR_FIRMWARE_TYPE_REGULAR" />,
                        }}
                    />
                }
            />
            {deviceWillBeWiped && <FirmwareWipeWarning />}
            <Card>
                <FirmwareOffer targetFirmwareType={targetFirmwareType} />
            </Card>
            <FirmwareWarningsList />
        </Column>
    );
};
