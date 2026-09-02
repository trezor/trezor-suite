import React from 'react';
import { type SvgProps } from 'react-native-svg';

import { Icon, type IconName } from '@suite-native/icons';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';
import { type Color } from '@trezor/theme';

import { Box } from '../Box';
import { CriticalIconSvg } from './CriticalIconSvg';
import { CriticalShapeSvg } from './CriticalShapeSvg';
import { InfoIconSvg } from './InfoIconSvg';
import { InfoShapeSvg } from './InfoShapeSvg';
import { SuccessIconSvg } from './SuccessIconSvg';
import { SuccessShapeSvg } from './SuccessShapeSvg';
import { WarningIconSvg } from './WarningIconSvg';
import { WarningShapeSvg } from './WarningShapeSvg';
import { type PictogramIconSvgProps } from './types';

export const PICTOGRAM_VARIANTS = ['success', 'info', 'warning', 'critical'] as const;
export type PictogramVariant = (typeof PICTOGRAM_VARIANTS)[number];

export type PictogramProps = {
    variant: PictogramVariant;
    icon?: IconName;
    size?: number;
};

type PictogramConfig = {
    ShapeSvg: (props: SvgProps) => React.JSX.Element;
    IconSvg: (props: PictogramIconSvgProps) => React.JSX.Element;
    iconOffset: number;
    iconSize: number;
    iconColor: Color;
};

const pictogramVariantsMap = {
    success: {
        ShapeSvg: SuccessShapeSvg,
        IconSvg: SuccessIconSvg,
        iconOffset: 0,
        iconSize: 54,
        iconColor: 'contentBrand',
    },
    info: {
        ShapeSvg: InfoShapeSvg,
        IconSvg: InfoIconSvg,
        iconOffset: 0,
        iconSize: 40,
        iconColor: 'contentInfo',
    },
    warning: {
        ShapeSvg: WarningShapeSvg,
        IconSvg: WarningIconSvg,
        iconOffset: 20,
        iconSize: 40,
        iconColor: 'contentWarning',
    },
    critical: {
        ShapeSvg: CriticalShapeSvg,
        IconSvg: CriticalIconSvg,
        iconOffset: 0,
        iconSize: 40,
        iconColor: 'contentCritical',
    },
} as const satisfies Record<PictogramVariant, PictogramConfig>;

const DEFAULT_PICTOGRAM_SIZE = 112;

const pictogramContainerStyle = prepareNativeStyle<{ size: number }>((_, { size }) => ({
    width: size,
    height: size,
}));

const iconContainerStyle = prepareNativeStyle<{ iconOffset?: number }>((_, { iconOffset }) => ({
    position: 'absolute',
    display: 'flex',
    width: '100%',
    height: '100%',
    paddingTop: iconOffset,
    alignItems: 'center',
    justifyContent: 'center',
}));

export const Pictogram = ({ variant, icon, size = DEFAULT_PICTOGRAM_SIZE }: PictogramProps) => {
    const { applyStyle, utils } = useNativeStyles();
    const { ShapeSvg, IconSvg, iconOffset, iconSize, iconColor } = pictogramVariantsMap[variant];
    const scale = size / DEFAULT_PICTOGRAM_SIZE;

    return (
        <Box style={applyStyle(pictogramContainerStyle, { size })}>
            <ShapeSvg width={size} height={size} />
            <Box style={applyStyle(iconContainerStyle, { iconOffset: iconOffset * scale })}>
                {icon ? (
                    <Icon name={icon} color={utils.colors[iconColor]} size={40 * scale} />
                ) : (
                    <IconSvg
                        color={utils.colors[iconColor]}
                        width={iconSize * scale}
                        height={iconSize * scale}
                    />
                )}
            </Box>
        </Box>
    );
};
