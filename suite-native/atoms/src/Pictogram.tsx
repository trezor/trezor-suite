import { ReactNode } from 'react';

import { IconName, Icon } from '@suite-common/icons';
import { Color, TypographyStyle } from '@trezor/theme';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { Box } from './Box';
import { Text } from './Text';
import { VStack } from './Stack';

export type PictogramVariant = 'green' | 'red' | 'yellow';
type PictogramSize = 'small' | 'large';

const ICON_SIZE = 40;

type PictogramProps = {
    variant: PictogramVariant;
    icon: IconName;
    size?: PictogramSize;
    title?: ReactNode;
    titleVariant?: TypographyStyle;
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

type PictogramSizeProps = { outerRingSize: number; innerRingSize: number };
const sizeToDimensionsMap = {
    small: {
        outerRingSize: 88,
        innerRingSize: 64,
    },
    large: {
        outerRingSize: 114,
        innerRingSize: 80,
    },
} as const satisfies Record<PictogramSize, PictogramSizeProps>;

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

export const Pictogram = ({
    variant,
    icon,
    title,
    subtitle,
    titleVariant = 'titleSmall',
    size = 'large',
}: PictogramProps) => {
    const { applyStyle } = useNativeStyles();
    const { outerBackgroundColor, innerBackgroundColor, iconColor } = pictogramVariantsMap[variant];
    const { outerRingSize, innerRingSize } = sizeToDimensionsMap[size];

    return (
        <VStack alignItems="center" spacing="large">
            <Box
                style={applyStyle(circleContainerStyle, {
                    backgroundColorName: outerBackgroundColor,
                    size: outerRingSize,
                })}
            >
                <Box
                    style={applyStyle(circleContainerStyle, {
                        backgroundColorName: innerBackgroundColor,
                        size: innerRingSize,
                    })}
                >
                    <Icon name={icon} color={iconColor} size={ICON_SIZE} />
                </Box>
            </Box>
            {title && (
                <VStack alignItems="center">
                    <Box>
                        <Text variant={titleVariant} textAlign="center">
                            {title}
                        </Text>
                    </Box>
                    <Text color="textSubdued" textAlign="center">
                        {subtitle}
                    </Text>
                </VStack>
            )}
        </VStack>
    );
};
