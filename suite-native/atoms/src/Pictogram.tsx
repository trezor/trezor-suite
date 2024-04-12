import { IconName, Icon } from '@suite-common/icons';
import { Color } from '@trezor/theme';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { Box } from './Box';

export type PictogramVariant = 'green' | 'red' | 'yellow';
export type PictogramSize = 'small' | 'large';

const ICON_SIZE = 40;

type PictogramProps = {
    variant: PictogramVariant;
    icon: IconName;
    size?: PictogramSize;
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

export const Pictogram = ({ variant, icon, size = 'large' }: PictogramProps) => {
    const { applyStyle } = useNativeStyles();
    const { outerBackgroundColor, innerBackgroundColor, iconColor } = pictogramVariantsMap[variant];
    const { outerRingSize, innerRingSize } = sizeToDimensionsMap[size];

    return (
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
    );
};
