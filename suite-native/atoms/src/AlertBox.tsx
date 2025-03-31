import { ReactNode } from 'react';
import { AccessibilityProps, ActivityIndicator } from 'react-native';

import { Icon, IconName } from '@suite-native/icons';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { Color, NativeRadius, NativeTypographyStyle } from '@trezor/theme';

import { Box } from './Box';
import { Text } from './Text';
import { nativeRadiusToNumber } from './utils';

export type AlertBoxVariant = 'info' | 'success' | 'warning' | 'loading' | 'error';

type AlertBoxStyle = {
    backgroundColor: Color;
    contentColor: Color;
    borderColor: Color;
};

type AlertWrapperStyleType = {
    borderRadius: number;
    backgroundColor: Color;
    borderColor: Color;
};

const alertWrapperStyle = prepareNativeStyle<AlertWrapperStyleType>(
    (utils, { borderColor, borderRadius, backgroundColor }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius,
        borderWidth: 1,
        borderColor: utils.colors[borderColor],
        backgroundColor: utils.colors[backgroundColor],
        paddingVertical: utils.spacings.sp8,
        paddingHorizontal: utils.spacings.sp16,
        gap: utils.spacings.sp12,
    }),
);

const textStyle = prepareNativeStyle(utils => ({
    flex: 1,
    paddingTop: utils.spacings.sp2,
}));

const variantToColorMap = {
    info: {
        backgroundColor: 'backgroundAlertBlueSubtleOnElevation1',
        contentColor: 'iconAlertBlue',
        borderColor: 'backgroundAlertBlueSubtleOnElevationNegative',
    },
    success: {
        backgroundColor: 'backgroundPrimarySubtleOnElevation1',
        contentColor: 'textSecondaryHighlight',
        borderColor: 'backgroundPrimarySubtleOnElevationNegative',
    },
    warning: {
        backgroundColor: 'backgroundAlertYellowSubtleOnElevation1',
        contentColor: 'iconAlertYellow',
        borderColor: 'backgroundAlertYellowSubtleOnElevationNegative',
    },
    loading: {
        backgroundColor: 'backgroundAlertYellowSubtleOnElevation1',
        contentColor: 'iconAlertYellow',
        borderColor: 'backgroundAlertYellowSubtleOnElevationNegative',
    },
    error: {
        backgroundColor: 'backgroundAlertRedSubtleOnElevation1',
        contentColor: 'textAlertRed',
        borderColor: 'backgroundAlertRedSubtleOnElevationNegative',
    },
} as const satisfies Record<AlertBoxVariant, AlertBoxStyle>;

const variantToIconName = {
    info: 'info',
    success: 'checkCircle',
    warning: 'warning',
    loading: 'warning',
    error: 'warningCircle',
} as const satisfies Record<AlertBoxVariant, IconName>;

export type AlertBoxProps = AccessibilityProps & {
    variant: AlertBoxVariant;
    title: ReactNode;
    borderRadius?: NativeRadius | number;
    contentColor?: Color;
    rightButton?: ReactNode;
    textVariant?: NativeTypographyStyle;
};

const AlertSpinner = ({ color }: { color: Color }) => {
    const {
        utils: { colors },
    } = useNativeStyles();

    return <ActivityIndicator size={16} color={colors[color]} />;
};

export const AlertBox = ({
    title,
    contentColor,
    rightButton,
    variant = 'info',
    borderRadius = 'r16',
    textVariant = 'label',
    ...props
}: AlertBoxProps) => {
    const { applyStyle } = useNativeStyles();
    const {
        contentColor: defaultContentColor,
        backgroundColor,
        borderColor,
    } = variantToColorMap[variant];

    const color = contentColor ?? defaultContentColor;

    return (
        <Box
            style={applyStyle(alertWrapperStyle, {
                borderRadius: nativeRadiusToNumber(borderRadius),
                borderColor,
                backgroundColor,
            })}
            {...props}
        >
            {variant === 'loading' ? (
                <AlertSpinner color={color} />
            ) : (
                <Icon name={variantToIconName[variant]} color={color} size="mediumLarge" />
            )}
            <Text color={color} variant={textVariant} style={applyStyle(textStyle)}>
                {title}
            </Text>
            {rightButton}
        </Box>
    );
};
