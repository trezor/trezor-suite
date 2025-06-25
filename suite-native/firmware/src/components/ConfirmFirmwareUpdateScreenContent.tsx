import React from 'react';
import { useSelector } from 'react-redux';

import {
    selectDeviceFirmwareVersion,
    selectDeviceUpdateFirmwareVersion,
    selectHasBitcoinOnlyFirmware,
    selectIsFirmwareUpgradable,
} from '@suite-common/wallet-core';
import { InlineAlertBox, Text, VStack } from '@suite-native/atoms';
import { Translation, useTranslate } from '@suite-native/intl';

import { FirmwareChangelogButton } from '../components/FirmwareChangelogButton';
import {
    FirmwareUpdateVersionCard,
    FirmwareVersionCard,
    concatFirmwareVersion,
} from '../components/FirmwareVersionCard';

const UpgradableContent = () => {
    const updateFirmwareVersion = useSelector(selectDeviceUpdateFirmwareVersion);

    return (
        <>
            <InlineAlertBox
                title={
                    <Translation
                        id="firmware.updateCard.updateToVersionAvailable"
                        values={{ firmwareVersion: updateFirmwareVersion }}
                    />
                }
                variant="info"
            />
            <VStack>
                <FirmwareUpdateVersionCard />
                <FirmwareChangelogButton />
            </VStack>
        </>
    );
};

const UpToDateContent = () => {
    const firmwareVersion = useSelector(selectDeviceFirmwareVersion);
    const isBtcOnly = useSelector(selectHasBitcoinOnlyFirmware);
    const { translate } = useTranslate();

    const firmwareTypeTranslationId = isBtcOnly
        ? 'firmware.typeBitcoinOnly'
        : 'firmware.typeUniversal';

    return (
        <>
            <InlineAlertBox
                title={<Translation id="firmware.updateCard.upToDate" />}
                variant="success"
            />
            <FirmwareVersionCard
                title={<Translation id="firmware.firmwareUpdateScreen.currentFirmware" />}
                titleColor="textSubdued"
                version={concatFirmwareVersion(firmwareVersion) ?? null}
                fwType={translate(firmwareTypeTranslationId)}
                backgroundColor="backgroundSurfaceElevation1"
                isFullWidth
            />
        </>
    );
};

export const ConfirmFirmwareUpdateScreenContent = () => {
    const isFirmwareUpgradable = useSelector(selectIsFirmwareUpgradable);

    return (
        <VStack spacing="sp32">
            <VStack>
                <Text variant="titleMedium">
                    <Translation id="firmware.firmwareUpdateScreen.title" />
                </Text>
                <Text variant="body" color="textSubdued">
                    <Translation id="firmware.firmwareUpdateScreen.subtitle" />
                </Text>
            </VStack>
            <VStack spacing="sp16">
                {isFirmwareUpgradable ? <UpgradableContent /> : <UpToDateContent />}
            </VStack>
        </VStack>
    );
};
