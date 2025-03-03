import { useFirmwareInstallation } from '@suite-common/firmware';
import { ExtendedMessageDescriptor } from '@suite-common/intl-types';
import { getFwUpdateVersion } from '@suite-common/suite-utils';
import { Banner, Card, Column, Text } from '@trezor/components';
import { FirmwareType } from '@trezor/connect';
import { getFirmwareVersion } from '@trezor/device-utils';
import { spacings } from '@trezor/theme';

import { FirmwareOffer } from 'src/components/firmware';
import { useDevice } from 'src/hooks/suite';

import { Translation } from '../suite';

type GetDescriptionProps = {
    required: boolean;
    reinstall: boolean;
    targetType: FirmwareType;
    shouldSwitchFirmwareType?: boolean;
    isBitcoinOnlyAvailable?: boolean;
};

const getDescription = ({
    required,
    reinstall,
    targetType,
    shouldSwitchFirmwareType,
    isBitcoinOnlyAvailable,
}: GetDescriptionProps) => {
    if (shouldSwitchFirmwareType) {
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

type FirmwareInitialProps = {
    shouldSwitchFirmwareType?: boolean;
};

export const FirmwareInitialStandalone = ({
    shouldSwitchFirmwareType = false,
}: FirmwareInitialProps) => {
    const { device } = useDevice();
    const { deviceWillBeWiped, targetFirmwareType } = useFirmwareInstallation({
        shouldSwitchFirmwareType,
    });

    // Just to satisfy TS, disconnected device should be handled upstream.
    if (!device?.connected || !device?.features) {
        return null;
    }

    // Bitcoin-only firmware is only available on T2T1 from v2.0.8 - older devices must first upgrade to 2.1.1 which does not have a Bitcoin-only variant
    const isBitcoinOnlyAvailable = !!device.firmwareRelease?.release.url_bitcoinonly;
    const currentFwVersion = getFirmwareVersion(device);
    const availableFwVersion = getFwUpdateVersion(device);
    const hasLatestAvailableFw = !!(
        availableFwVersion &&
        currentFwVersion &&
        availableFwVersion === currentFwVersion
    );

    const warningTranslationValues: ExtendedMessageDescriptor['values'] = {
        b: chunks => <Text typographyStyle="callout">{chunks}</Text>,
    };

    return (
        <Column gap={spacings.sm}>
            <Banner variant="info" icon="info">
                <Translation
                    id={getDescription({
                        /**
                         * `device.firmware` is status of the firmware currently installed on the device.
                         *  available values: 'valid' | 'outdated' | 'required' | 'unknown' | 'none'
                         *
                         *  `device.firmwareRelease` on the other hand contains latest available firmware to update to
                         *   (it is whatever returns getInfo() method from connect)
                         *   so it should not be used here.
                         */
                        required: device.firmware === 'required',
                        reinstall: device.firmware === 'valid' || hasLatestAvailableFw,
                        targetType: targetFirmwareType,
                        shouldSwitchFirmwareType,
                        isBitcoinOnlyAvailable,
                    })}
                    values={{
                        bitcoinOnly: <Translation id="TR_FIRMWARE_TYPE_BITCOIN_ONLY" />,
                        regular: <Translation id="TR_FIRMWARE_TYPE_REGULAR" />,
                    }}
                />
            </Banner>
            {deviceWillBeWiped && (
                <>
                    <Banner variant="destructive" icon="warning">
                        <Translation
                            id="TR_FIRMWARE_SWITCH_WARNING_1"
                            values={warningTranslationValues}
                        />
                    </Banner>
                    <Banner variant="destructive" icon="warning">
                        <Translation
                            id="TR_FIRMWARE_SWITCH_WARNING_2"
                            values={warningTranslationValues}
                        />
                    </Banner>
                </>
            )}
            <Card>
                <FirmwareOffer targetFirmwareType={targetFirmwareType} />
            </Card>
        </Column>
    );
};
