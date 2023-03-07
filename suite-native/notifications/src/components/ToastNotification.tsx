import React from 'react';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { Box, HStack, Text } from '@suite-native/atoms';
import { Icon, IconName } from '@trezor/icons';
import { Color } from '@trezor/theme';

export type ToastNotificationVariant = 'default' | 'success' | 'warning' | 'error' | 'info';

type ToastNotificationProps = {
    variant?: ToastNotificationVariant;
    icon?: IconName;
    title: string;
};

type ToastNotificationStyle = {
    backgroundColor: Color;
    iconBackgroundColor: Color;
    textColor: Color;
    iconColor: Color;
    defaultIcon: IconName;
};

const ToastContainerStyle = prepareNativeStyle<{ backgroundColor: Color }>(
    (utils, { backgroundColor }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: utils.colors[backgroundColor],
        paddingVertical: utils.spacings.small / 2,
        paddingLeft: utils.spacings.small / 2,
        paddingRight: utils.spacings.medium,
        borderRadius: utils.borders.radii.round,
    }),
);

const IconContainerStyle = prepareNativeStyle<{
    backgroundColor: Color;
    isDefaultVariant: boolean;
}>((utils, { backgroundColor, isDefaultVariant }) => ({
    padding: utils.spacings.small * 1.5,
    borderRadius: utils.borders.radii.round,
    backgroundColor: utils.transparentize(
        isDefaultVariant ? 0.75 : 0,
        utils.colors[backgroundColor],
    ),
}));

const ToastNotificationVariantToStyleMap = {
    default: {
        backgroundColor: 'backgroundNeutralBold',
        iconBackgroundColor: 'iconSubdued',
        textColor: 'textOnPrimary',
        iconColor: 'iconOnPrimary',
        defaultIcon: 'copy',
    },
    success: {
        backgroundColor: 'backgroundPrimarySubtleOnElevation0',
        iconBackgroundColor: 'backgroundPrimarySubtleOnElevation1',
        textColor: 'textPrimaryDefault',
        iconColor: 'iconPrimaryDefault',
        defaultIcon: 'check',
    },
    warning: {
        backgroundColor: 'backgroundAlertYellowSubtleOnElevation0',
        iconBackgroundColor: 'backgroundAlertYellowSubtleOnElevation1',
        textColor: 'textAlertYellow',
        iconColor: 'iconAlertYellow',
        defaultIcon: 'warningCircle',
    },
    error: {
        backgroundColor: 'backgroundAlertRedSubtleOnElevation0',
        iconBackgroundColor: 'backgroundAlertRedSubtleOnElevation1',
        textColor: 'textAlertRed',
        iconColor: 'iconAlertRed',
        defaultIcon: 'warningTriangle',
    },
    info: {
        backgroundColor: 'backgroundAlertBlueSubtleOnElevation0',
        iconBackgroundColor: 'backgroundAlertBlueSubtleOnElevation1',
        textColor: 'textAlertBlue',
        iconColor: 'iconAlertBlue',
        defaultIcon: 'info',
    },
} as const satisfies Record<ToastNotificationVariant, ToastNotificationStyle>;

export const ToastNotification = ({ variant = 'default', title, icon }: ToastNotificationProps) => {
    const { applyStyle } = useNativeStyles();
    const { defaultIcon, backgroundColor, iconBackgroundColor, textColor, iconColor } =
        ToastNotificationVariantToStyleMap[variant];

    const iconName = icon ?? defaultIcon;

    return (
        <Animated.View entering={FadeIn} exiting={FadeOut}>
            <HStack style={applyStyle(ToastContainerStyle, { backgroundColor })} spacing={12}>
                <Box
                    style={applyStyle(IconContainerStyle, {
                        backgroundColor: iconBackgroundColor,
                        isDefaultVariant: variant === 'default',
                    })}
                >
                    <Icon name={iconName} color={iconColor} size="medium" />
                </Box>
                <Text color={textColor}>{title}</Text>
            </HStack>
        </Animated.View>
    );
};
