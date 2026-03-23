import { type ReactNode } from 'react';
import { PixelRatio } from 'react-native';
import { useSelector } from 'react-redux';

import {
    selectDeviceFirmwareVersionArray,
    selectDeviceUpdateFirmwareVersion,
    selectHasBitcoinOnlyFirmware,
    selectIsFirmwareUpgradable,
} from '@suite-common/device';
import {
    Box,
    Card,
    HStack,
    InlineAlertText,
    type InlineAlertTextProps,
    Text,
    VStack,
} from '@suite-native/atoms';
import { Icon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';
import type { VersionArray } from '@trezor/utils';

import { FirmwareChangelogButton } from './FirmwareChangelogButton';
import { FirmwareInfoBox } from './FirmwareInfoBox';

type FirmwareVersionCardProps = {
    isUpdateRequired: boolean;
    children?: ReactNode;
};

const concatFirmwareVersion = (firmwareVersion: VersionArray | null) =>
    firmwareVersion?.join('.') ?? null;

const firmwareArrowStyle = prepareNativeStyle(utils => {
    const firmwareArrowSize = (32 + 4) * PixelRatio.getFontScale();

    return {
        position: 'absolute',
        width: firmwareArrowSize,
        height: firmwareArrowSize,
        top: -(firmwareArrowSize / 2 + utils.spacings.sp4),
        zIndex: 3,
        backgroundColor: utils.colors.backgroundTertiaryDefaultOnElevation1,
        borderColor: utils.colors.backgroundSurfaceElevation1,
        borderRadius: utils.borders.radii.round,
        borderWidth: utils.spacings.sp4,
        justifyContent: 'center',
        alignItems: 'center',
    };
});

export const FirmwareVersionCard = ({ isUpdateRequired, children }: FirmwareVersionCardProps) => {
    const { applyStyle } = useNativeStyles();

    const isFirmwareUpgradable = useSelector(selectIsFirmwareUpgradable);
    const firmwareVersion = useSelector(selectDeviceFirmwareVersionArray);
    const updateFirmwareVersion = useSelector(selectDeviceUpdateFirmwareVersion);
    const isBtcOnly = useSelector(selectHasBitcoinOnlyFirmware);

    const inlineAlertTextProps: InlineAlertTextProps = (() => {
        if (isUpdateRequired) {
            return {
                variant: 'critical',
                children: <Translation id="firmware.versionCard.status.updateRequired" />,
            };
        } else if (isFirmwareUpgradable) {
            return {
                variant: 'info',
                children: <Translation id="firmware.versionCard.status.updateAvailable" />,
            };
        } else {
            return {
                variant: 'success',
                children: <Translation id="firmware.versionCard.status.upToDate" />,
            };
        }
    })();
    const firmwareType = isBtcOnly ? 'firmware.typeBitcoinOnly' : 'firmware.typeUniversal';

    return (
        <Card>
            <VStack spacing="sp16">
                <HStack alignItems="center" justifyContent="space-between">
                    <HStack>
                        <Icon name="cpu" size="mediumLarge" />
                        <Text variant="body-md">
                            <Translation id="firmware.versionCard.title" />
                        </Text>
                    </HStack>
                    <InlineAlertText {...inlineAlertTextProps} />
                </HStack>
                <VStack spacing="sp6">
                    <FirmwareInfoBox
                        backgroundColor="backgroundTertiaryDefaultOnElevation1"
                        title={<Translation id="firmware.versionCard.currentFirmware" />}
                        titleColor="textSubdued"
                        version={concatFirmwareVersion(firmwareVersion)}
                        type={firmwareType}
                        paddingBottom={isFirmwareUpgradable ? 'sp24' : 'sp16'}
                    />
                    {isFirmwareUpgradable && (
                        <FirmwareInfoBox
                            backgroundColor="backgroundSurfaceElevation1"
                            title={<Translation id="firmware.versionCard.newFirmware" />}
                            titleColor="textPrimaryDefault"
                            version={updateFirmwareVersion}
                            type={firmwareType}
                            paddingTop="sp24"
                        >
                            <FirmwareChangelogButton />
                            <Box style={applyStyle(firmwareArrowStyle)}>
                                <Icon
                                    name="arrowDown"
                                    color="iconPrimaryDefault"
                                    size="mediumLarge"
                                />
                            </Box>
                        </FirmwareInfoBox>
                    )}
                </VStack>
                {children}
            </VStack>
        </Card>
    );
};
