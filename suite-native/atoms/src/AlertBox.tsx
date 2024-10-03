import { ReactNode } from 'react';
import { ActivityIndicator } from 'react-native';

import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { Color, nativeBorders } from '@trezor/theme';
import { Icon, IconName } from '@suite-common/icons-deprecated';

import { Box } from './Box';
import { Text } from './Text';

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
    warning: 'warningTriangle',
    loading: 'warningTriangle',
    error: 'warningCircle',
} as const satisfies Record<AlertBoxVariant, IconName>;

export type AlertBoxProps = {
    variant: AlertBoxVariant;
    title: ReactNode;
    borderRadius?: number;
};

const AlertSpinner = ({ color }: { color: Color }) => {
    const {
        utils: { colors },
    } = useNativeStyles();

    return <ActivityIndicator size={16} color={colors[color]} />;
};

export const AlertBox = ({
    title,
    variant = 'info',
    borderRadius = nativeBorders.radii.r16,
}: AlertBoxProps) => {
    const { applyStyle } = useNativeStyles();
    const { contentColor, backgroundColor, borderColor } = variantToColorMap[variant];

    return (
        <Box
            style={applyStyle(alertWrapperStyle, {
                borderRadius,
                borderColor,
                backgroundColor,
            })}
        >
            {variant === 'loading' ? (
                <AlertSpinner color={contentColor} />
            ) : (
                <Icon name={variantToIconName[variant]} color={contentColor} size="mediumLarge" />
            )}
            <Text color={contentColor} variant="label" style={applyStyle(textStyle)}>
                {title}
            </Text>
        </Box>
    );
};
