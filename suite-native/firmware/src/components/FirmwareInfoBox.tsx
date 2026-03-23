import { type ReactNode } from 'react';

import { Box, type BoxProps, Text, VStack } from '@suite-native/atoms';
import { Translation, type TxKeyPath } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';
import { type Color } from '@trezor/theme';

type FirmwareInfoBoxProps = {
    backgroundColor: Color;
    title: ReactNode;
    titleColor: Color;
    version: string | null;
    type: TxKeyPath;
} & BoxProps;

const containerStyle = prepareNativeStyle<{ backgroundColor: Color }>(
    (utils, { backgroundColor }) => ({
        padding: utils.spacings.sp16,
        gap: utils.spacings.sp12,
        backgroundColor: utils.colors[backgroundColor],
        borderColor: utils.colors.borderElevation1,
        borderRadius: utils.borders.radii.r12,
        borderWidth: utils.borders.widths.small,
        alignItems: 'center',
        justifyContent: 'center',
    }),
);

export const FirmwareInfoBox = ({
    backgroundColor,
    title,
    titleColor,
    version,
    type,
    children,
    ...boxProps
}: FirmwareInfoBoxProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <Box style={applyStyle(containerStyle, { backgroundColor })} {...boxProps}>
            <VStack spacing="sp2" alignItems="center">
                <Text variant="body-md" color={titleColor}>
                    {title}
                </Text>
                <Text variant="body-md-strong">
                    <Text variant="body-md-strong">{version ?? '?.?.?'}</Text>
                    {' • '}
                    <Text variant="body-md-strong">
                        <Translation id={type} />
                    </Text>
                </Text>
            </VStack>
            {children}
        </Box>
    );
};
