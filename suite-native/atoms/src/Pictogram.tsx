import React, { ReactNode } from 'react';

import { IconName, Icon } from '@suite-common/icons';
import { Color } from '@trezor/theme';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { Box } from './Box';
import { Text } from './Text';
import { VStack } from './Stack';

export type PictogramVariant = 'green' | 'red' | 'yellow';

type PictogramProps = {
    variant: PictogramVariant;
    icon: IconName;
    title: ReactNode;
    subtitle?: string;
};

type PictogramStyle = {
    outerBackgroundColor: Color;
    innerBackgroundColor: Color;
    iconColor: Color;
};
const pictogramVariantsMap = {
    green: {
        outerBackgroundColor: 'backgroundPrimarySubtleOnElevation0',
        innerBackgroundColor: 'backgroundPrimarySubtleOnElevation1',
        iconColor: 'iconPrimaryDefault',
    },
    red: {
        outerBackgroundColor: 'backgroundAlertRedSubtleOnElevation0',
        innerBackgroundColor: 'backgroundAlertRedSubtleOnElevation1',
        iconColor: 'iconAlertRed',
    },
    yellow: {
        outerBackgroundColor: 'backgroundAlertYellowSubtleOnElevation0',
        innerBackgroundColor: 'backgroundAlertYellowSubtleOnElevation1',
        iconColor: 'iconAlertYellow',
    },
} as const satisfies Record<PictogramVariant, PictogramStyle>;

const OUTER_RING_SIZE = 114;
const INNER_RING_SIZE = 80;
const ICON_SIZE = 48;

type CircleStyleProps = { backgroundColorName: Color; size: number };

const circleContainerStyle = prepareNativeStyle<CircleStyleProps>(
    (utils, { backgroundColorName, size }) => ({
        alignItems: 'center',
        justifyContent: 'center',
        width: size,
        height: size,
        backgroundColor: utils.colors[backgroundColorName],
        borderRadius: utils.borders.radii.round,
    }),
);

export const Pictogram = ({ variant, icon, title, subtitle }: PictogramProps) => {
    const { applyStyle } = useNativeStyles();
    const { outerBackgroundColor, innerBackgroundColor, iconColor } = pictogramVariantsMap[variant];
    return (
        <VStack alignItems="center" spacing="medium">
            <Box
                style={applyStyle(circleContainerStyle, {
                    backgroundColorName: outerBackgroundColor,
                    size: OUTER_RING_SIZE,
                })}
            >
                <Box
                    style={applyStyle(circleContainerStyle, {
                        backgroundColorName: innerBackgroundColor,
                        size: INNER_RING_SIZE,
                    })}
                >
                    <Icon name={icon} color={iconColor} size={ICON_SIZE} />
                </Box>
            </Box>
            <VStack alignItems="center">
                <Text variant="titleSmall" align="center">
                    {title}
                </Text>
                <Text color="textSubdued" align="center">
                    {subtitle}
                </Text>
            </VStack>
        </VStack>
    );
};
