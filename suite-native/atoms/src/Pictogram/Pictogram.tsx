import React from 'react';

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
    ShapeSvg: () => React.JSX.Element;
    IconSvg: (props: PictogramIconSvgProps) => React.JSX.Element;
    iconOffset: number;
    iconColor: Color;
};

const pictogramVariantsMap = {
    success: {
        ShapeSvg: SuccessShapeSvg,
        IconSvg: SuccessIconSvg,
        iconOffset: 0,
        iconColor: 'contentBrand',
    },
    info: {
        ShapeSvg: InfoShapeSvg,
        IconSvg: InfoIconSvg,
        iconOffset: 0,
        iconColor: 'contentInfo',
    },
    warning: {
        ShapeSvg: WarningShapeSvg,
        IconSvg: WarningIconSvg,
        iconOffset: 20,
        iconColor: 'contentWarning',
    },
    critical: {
        ShapeSvg: CriticalShapeSvg,
        IconSvg: CriticalIconSvg,
        iconOffset: 0,
        iconColor: 'contentCritical',
    },
} as const satisfies Record<PictogramVariant, PictogramConfig>;

const DEFAULT_PICTOGRAM_SIZE = 112;

const pictogramContainerStyle = prepareNativeStyle<{ size: number }>((_, { size }) => ({
    width: size,
    height: size,
}));

const pictogramContentStyle = prepareNativeStyle<{ size: number }>((_, { size }) => ({
    position: 'absolute',
    width: DEFAULT_PICTOGRAM_SIZE,
    height: DEFAULT_PICTOGRAM_SIZE,
    top: (size - DEFAULT_PICTOGRAM_SIZE) / 2,
    left: (size - DEFAULT_PICTOGRAM_SIZE) / 2,
    transform: [{ scale: size / DEFAULT_PICTOGRAM_SIZE }],
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
    const { ShapeSvg, IconSvg, iconOffset, iconColor } = pictogramVariantsMap[variant];

    return (
        <Box style={applyStyle(pictogramContainerStyle, { size })}>
            <Box style={applyStyle(pictogramContentStyle, { size })}>
                <ShapeSvg />
                <Box style={applyStyle(iconContainerStyle, { iconOffset })}>
                    {icon ? (
                        <Icon name={icon} color={utils.colors[iconColor]} size={40} />
                    ) : (
                        <IconSvg color={utils.colors[iconColor]} />
                    )}
                </Box>
            </Box>
        </Box>
    );
};
