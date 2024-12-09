import React from 'react';

import { Icon, IconName } from '@suite-native/icons';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { Color } from '@trezor/theme';

import { Box } from '../Box';
import { CriticalIconSvg } from './CriticalIconSvg';
import { CriticalShapeSvg } from './CriticalShapeSvg';
import { InfoIconSvg } from './InfoIconSvg';
import { InfoShapeSvg } from './InfoShapeSvg';
import { SuccessIconSvg } from './SuccessIconSvg';
import { SuccessShapeSvg } from './SuccessShapeSvg';
import { PictogramIconSvgProps } from './types';
import { WarningIconSvg } from './WarningIconSvg';
import { WarningShapeSvg } from './WarningShapeSvg';

export type PictogramVariant = 'success' | 'info' | 'warning' | 'critical';

type PictogramProps = {
    variant: PictogramVariant;
    icon?: IconName;
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
        iconColor: 'iconPrimaryDefault',
    },
    info: {
        ShapeSvg: InfoShapeSvg,
        IconSvg: InfoIconSvg,
        iconOffset: 0,
        iconColor: 'iconAlertBlue',
    },
    warning: {
        ShapeSvg: WarningShapeSvg,
        IconSvg: WarningIconSvg,
        iconOffset: 20,
        iconColor: 'iconAlertYellow',
    },
    critical: {
        ShapeSvg: CriticalShapeSvg,
        IconSvg: CriticalIconSvg,
        iconOffset: 0,
        iconColor: 'iconAlertRed',
    },
} as const satisfies Record<PictogramVariant, PictogramConfig>;

const pictogramContainerStyle = prepareNativeStyle(_ => ({
    width: 112,
    height: 112,
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

export const Pictogram = ({ variant, icon }: PictogramProps) => {
    const { applyStyle, utils } = useNativeStyles();
    const { ShapeSvg, IconSvg, iconOffset, iconColor } = pictogramVariantsMap[variant];

    return (
        <Box style={applyStyle(pictogramContainerStyle)}>
            <ShapeSvg />
            <Box style={applyStyle(iconContainerStyle, { iconOffset })}>
                {icon ? (
                    <Icon name={icon} color={utils.colors[iconColor]} size={40} />
                ) : (
                    <IconSvg color={utils.colors[iconColor]} />
                )}
            </Box>
        </Box>
    );
};
