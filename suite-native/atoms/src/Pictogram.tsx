import { Icon, IconName } from '@suite-native/icons';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { Color } from '@trezor/theme';

import { Box } from './Box';

export type PictogramVariant = 'success' | 'info' | 'warning' | 'critical';

type PictogramProps = {
    variant: PictogramVariant;
    icon?: IconName;
};

type PictogramStyle = {
    outerBackgroundColor: Color;
    innerBackgroundColor: Color;
    iconName: IconName;
    iconColor: Color;
};

const pictogramVariantsMap = {
    success: {
        outerBackgroundColor: 'backgroundPrimarySubtleOnElevation0',
        innerBackgroundColor: 'backgroundPrimarySubtleOnElevation1',
        iconName: 'checkCircle',
        iconColor: 'iconPrimaryDefault',
    },
    info: {
        outerBackgroundColor: 'backgroundAlertBlueSubtleOnElevation0',
        innerBackgroundColor: 'backgroundAlertBlueSubtleOnElevation1',
        iconName: 'info',
        iconColor: 'iconAlertBlue',
    },
    warning: {
        outerBackgroundColor: 'backgroundAlertYellowSubtleOnElevation0',
        innerBackgroundColor: 'backgroundAlertYellowSubtleOnElevation1',
        iconName: 'warning',
        iconColor: 'iconAlertYellow',
    },
    critical: {
        outerBackgroundColor: 'backgroundAlertRedSubtleOnElevation0',
        innerBackgroundColor: 'backgroundAlertRedSubtleOnElevation1',
        iconName: 'warning',
        iconColor: 'iconAlertRed',
    },
} as const satisfies Record<PictogramVariant, PictogramStyle>;

const circleContainerStyle = prepareNativeStyle<{ backgroundColorName: Color; size: number }>(
    (utils, { backgroundColorName, size }) => ({
        alignItems: 'center',
        justifyContent: 'center',
        width: size,
        height: size,
        backgroundColor: utils.colors[backgroundColorName],
        borderRadius: utils.borders.radii.round,
    }),
);

export const Pictogram = ({ variant, icon }: PictogramProps) => {
    const { applyStyle } = useNativeStyles();
    const { outerBackgroundColor, innerBackgroundColor, iconName, iconColor } =
        pictogramVariantsMap[variant];

    return (
        <Box
            style={applyStyle(circleContainerStyle, {
                backgroundColorName: outerBackgroundColor,
                size: 104,
            })}
        >
            <Box
                style={applyStyle(circleContainerStyle, {
                    backgroundColorName: innerBackgroundColor,
                    size: 80,
                })}
            >
                <Icon name={icon ?? iconName} color={iconColor} size={40} />
            </Box>
        </Box>
    );
};
