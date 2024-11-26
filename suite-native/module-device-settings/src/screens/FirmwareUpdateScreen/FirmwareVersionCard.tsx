import { PixelRatio } from 'react-native';
import { useSelector } from 'react-redux';

import {
    selectDeviceFirmwareVersion,
    selectDeviceUpdateFirmwareVersion,
    selectIsBitcoinOnlyDevice,
} from '@suite-common/wallet-core';
import { Box, BoxProps, Text } from '@suite-native/atoms';
import { Icon } from '@suite-native/icons';
import { useTranslate } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { Color } from '@trezor/theme';

type FirmwareVersionCardProps = {
    title: string;
    titleColor: Color;
    version: string;
    fwType: string;
    backgroundColor: Color;
} & BoxProps;

const cardContainerStyle = prepareNativeStyle<{ backgroundColor: Color }>(
    (utils, { backgroundColor }) => ({
        padding: utils.spacings.sp16,
        backgroundColor: utils.colors[backgroundColor],
        borderRadius: utils.borders.radii.r12,
        width: '50%',
        justifyContent: 'center',
    }),
);

export const FirmwareVersionCard = ({
    title,
    version,
    fwType,
    titleColor,
    backgroundColor,
    children,
    ...boxProps
}: FirmwareVersionCardProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <Box style={applyStyle(cardContainerStyle, { backgroundColor })} {...boxProps}>
            <Text variant="body" color={titleColor}>
                {title}
            </Text>
            <Text variant="highlight">
                <Text variant="highlight">{version}</Text>
                {' • '}
                <Text variant="highlight">{fwType}</Text>
            </Text>
            {children}
        </Box>
    );
};

const firmwareArrowStyle = prepareNativeStyle(utils => {
    const firmwareArrowSize = (32 + 4) * PixelRatio.getFontScale();

    return {
        height: firmwareArrowSize,
        width: firmwareArrowSize,
        borderRadius: utils.borders.radii.round,
        backgroundColor: utils.colors.backgroundSurfaceElevation1,
        borderColor: utils.colors.backgroundSurfaceElevation0,
        borderWidth: 4,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'absolute',
        zIndex: 3,
        left: -(firmwareArrowSize / 2),
    };
});

export const FirmwareUpdateVersionCard = (props: BoxProps) => {
    const { applyStyle } = useNativeStyles();
    const firmwareVersion = useSelector(selectDeviceFirmwareVersion);
    const updateFirmwareVersion = useSelector(selectDeviceUpdateFirmwareVersion);
    const isBtcOnly = useSelector(selectIsBitcoinOnlyDevice);
    const { translate } = useTranslate();

    const firmwareTypeTranslationId = isBtcOnly
        ? 'moduleDeviceSettings.firmware.typeBitcoinOnly'
        : 'moduleDeviceSettings.firmware.typeUniversal';

    return (
        <Box flexDirection="row" justifyContent="center" alignItems="center" {...props}>
            <FirmwareVersionCard
                title="Current firmware"
                titleColor="textSubdued"
                version={firmwareVersion?.join('.') ?? '?.?.?'}
                fwType={translate(firmwareTypeTranslationId)}
                flex={1}
                backgroundColor="backgroundTertiaryDefaultOnElevation0"
                marginRight="sp2"
            />

            <FirmwareVersionCard
                title="Update firmware"
                titleColor="textPrimaryDefault"
                version={updateFirmwareVersion ?? '?.?.?'}
                fwType={translate(firmwareTypeTranslationId)}
                flex={1}
                backgroundColor="backgroundSurfaceElevation1"
                marginLeft="sp2"
                paddingLeft="sp32"
            >
                <Box style={applyStyle(firmwareArrowStyle)}>
                    <Icon name="arrowRight" color="iconPrimaryDefault" size="mediumLarge" />
                </Box>
            </FirmwareVersionCard>
        </Box>
    );
};
