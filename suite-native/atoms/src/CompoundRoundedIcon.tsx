import { G } from '@mobily/ts-belt';

import { NetworkSymbol } from '@suite-common/wallet-config';
import { TokenAddress } from '@suite-common/wallet-types';
import { CryptoIcon, Icon, IconName, IconSize, icons } from '@suite-native/icons';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { Color } from '@trezor/theme';

import { Box, BoxProps } from './Box';

export type CompoundRoundedIconProps = {
    symbol?: NetworkSymbol;
    contractAddress?: TokenAddress;
    compoundIcons: {
        name?: IconName;
        color?: Color;
        size?: IconSize;
    }[];
    containerSize?: number;
    backgroundColor?: Color;
} & BoxProps;

const DEFAULT_CONTAINER_SIZE = 48;

const iconContainerStyle = prepareNativeStyle<{
    backgroundColor?: Color;
    containerSizeWidth?: number;
    containerSizeHeight?: number;
}>((utils, { backgroundColor, containerSizeWidth, containerSizeHeight }) => ({
    justifyContent: 'center',
    alignItems: 'center',
    width: containerSizeWidth ?? DEFAULT_CONTAINER_SIZE,
    height: containerSizeHeight ?? DEFAULT_CONTAINER_SIZE,
    backgroundColor: utils.colors.backgroundSurfaceElevation2,
    borderRadius: utils.borders.radii.round,
    flexDirection: 'row',
    gap: utils.spacings.sp4,

    extend: {
        condition: G.isNotNullable(backgroundColor),
        style: {
            backgroundColor: utils.colors[backgroundColor as Color],
        },
    },
}));

export const CompoundRoundedIcon = ({
    symbol,
    compoundIcons,
    contractAddress,
    backgroundColor,
    containerSize,
    style,
    ...boxProps
}: CompoundRoundedIconProps) => {
    const { applyStyle } = useNativeStyles();

    const iconsCount = compoundIcons?.length ?? 0;
    const containerSizeWidth =
        containerSize && iconsCount > 0 ? iconsCount * containerSize : undefined;

    return (
        <Box
            style={[
                applyStyle(iconContainerStyle, {
                    backgroundColor,
                    containerSizeWidth,
                    containerSizeHeight: containerSize,
                }),
                style,
            ]}
            {...boxProps}
        >
            {compoundIcons.map(({ name, color, size }) =>
                name && name in icons ? (
                    <Icon
                        name={name as IconName}
                        color={color}
                        size={size}
                        key={`${name}-${color ?? 'default'}-${size ?? 'default'}`}
                    />
                ) : (
                    symbol && <CryptoIcon symbol={symbol} contractAddress={contractAddress} />
                ),
            )}
        </Box>
    );
};
