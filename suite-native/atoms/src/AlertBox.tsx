import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { Color } from '@trezor/theme';
import { Icon, IconName } from '@suite-common/icons';

import { Box } from './Box';
import { Text } from './Text';

export type AlertBoxVariant = 'info' | 'success' | 'warning' | 'error';

type AlertBoxStyle = {
    backgroundColor: Color;
    contentColor: Color;
};

type AlertWrapperStyleType = {
    isStandalone: boolean;
    backgroundColor: Color;
};

const alertWrapperStyle = prepareNativeStyle<AlertWrapperStyleType>(
    (utils, { isStandalone, backgroundColor }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: utils.borders.radii.small,
        backgroundColor: utils.colors[backgroundColor],
        paddingVertical: utils.spacings.small,
        paddingHorizontal: utils.spacings.medium,
        gap: utils.spacings.small,

        extend: {
            condition: !isStandalone,
            style: {
                borderRadius: 0,
                borderTopLeftRadius: utils.borders.radii.medium,
                borderTopRightRadius: utils.borders.radii.medium,
            },
        },
    }),
);

const textStyle = prepareNativeStyle(_ => ({
    flex: 1,
}));

const variantToColorMap = {
    info: {
        backgroundColor: 'backgroundAlertBlueSubtleOnElevation0',
        contentColor: 'iconAlertBlue',
    },
    success: {
        backgroundColor: 'backgroundPrimarySubtleOnElevation0',
        contentColor: 'textSecondaryHighlight',
    },
    warning: {
        backgroundColor: 'backgroundAlertYellowSubtleOnElevation0',
        contentColor: 'textAlertYellow',
    },
    error: {
        backgroundColor: 'backgroundAlertRedSubtleOnElevation0',
        contentColor: 'textAlertRed',
    },
} as const satisfies Record<AlertBoxVariant, AlertBoxStyle>;

const variantToIconName = {
    info: 'info',
    success: 'checkCircle',
    warning: 'warningTriangle',
    error: 'warningTriangle',
} as const satisfies Record<AlertBoxVariant, IconName>;

type AlertBoxProps = {
    variant: AlertBoxVariant;
    title?: React.ReactNode;
    isStandalone?: boolean;
};

export const AlertBox = ({ title, isStandalone = false, variant = 'info' }: AlertBoxProps) => {
    const { applyStyle } = useNativeStyles();
    const { contentColor, backgroundColor } = variantToColorMap[variant];

    return (
        <Box
            style={applyStyle(alertWrapperStyle, {
                isStandalone,
                backgroundColor,
            })}
        >
            <Icon name={variantToIconName[variant]} color={contentColor} size="mediumLarge" />
            <Text color={contentColor} variant="label" style={applyStyle(textStyle)}>
                {title}
            </Text>
        </Box>
    );
};
