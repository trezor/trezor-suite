import { type ReactNode } from 'react';

import { Box, HStack } from '@suite-native/atoms';
import { Icon } from '@suite-native/icons';
import { type NativeStyleObject, prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';
import { palette } from '@trezor/theme';

import { CardBackgroundSvg } from './CardBackgroundSvg';

type VoucherCardProps = {
    style?: NativeStyleObject;
    children?: ReactNode;
};

const cardStyle = prepareNativeStyle(({ borders }) => ({
    width: '100%',
    aspectRatio: 334 / 174,
    borderWidth: borders.widths.small,
    borderRadius: borders.radii.r16,
    borderColor: palette.globalWhiteAlpha25,
    backgroundColor: palette.lightGreen800,
    overflow: 'hidden', // ensures the background is not visible around edges
}));

export const VoucherCard = ({ style, children }: VoucherCardProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <Box style={[applyStyle(cardStyle), style]}>
            <CardBackgroundSvg />
            {children && (
                <HStack padding="sp12" justifyContent="space-between">
                    <Box padding="sp4">{children}</Box>
                    <Icon name="trezorLogo" size={32} color={palette.lightGreen800} />
                </HStack>
            )}
        </Box>
    );
};
