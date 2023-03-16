import React, { useEffect } from 'react';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useDispatch } from 'react-redux';

import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { Box, HStack, Text } from '@suite-native/atoms';
import { Icon } from '@trezor/icons';
import { Color } from '@trezor/theme';

import {
    ToastNotification as ToastNotificationInterface,
    ToastNotificationVariant,
} from '../types';
import { removeToastNotification } from '../slice';

type ToastNotificationProps = {
    notification: ToastNotificationInterface;
};

const TOAST_VISIBLE_DURATION = 1500;
const TOAST_ANIMATION_DURATION = 500;

type ToastNotificationStyle = {
    backgroundColor: Color;
    iconBackgroundColor: Color;
    textColor: Color;
    iconColor: Color;
};

const ToastContainerStyle = prepareNativeStyle<{ backgroundColor: Color }>(
    (utils, { backgroundColor }) => ({
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

const toastVariantToStyleMap = {
    default: {
        backgroundColor: 'backgroundNeutralBold',
        iconBackgroundColor: 'iconSubdued',
        textColor: 'textOnPrimary',
        iconColor: 'iconOnPrimary',
    },
    success: {
        backgroundColor: 'backgroundPrimarySubtleOnElevation0',
        iconBackgroundColor: 'backgroundPrimarySubtleOnElevation1',
        textColor: 'textPrimaryDefault',
        iconColor: 'iconPrimaryDefault',
    },
    warning: {
        backgroundColor: 'backgroundAlertYellowSubtleOnElevation0',
        iconBackgroundColor: 'backgroundAlertYellowSubtleOnElevation1',
        textColor: 'textAlertYellow',
        iconColor: 'iconAlertYellow',
    },
    error: {
        backgroundColor: 'backgroundAlertRedSubtleOnElevation0',
        iconBackgroundColor: 'backgroundAlertRedSubtleOnElevation1',
        textColor: 'textAlertRed',
        iconColor: 'iconAlertRed',
    },
    info: {
        backgroundColor: 'backgroundAlertBlueSubtleOnElevation0',
        iconBackgroundColor: 'backgroundAlertBlueSubtleOnElevation1',
        textColor: 'textAlertBlue',
        iconColor: 'iconAlertBlue',
    },
} as const satisfies Record<ToastNotificationVariant, ToastNotificationStyle>;

export const ToastNotification = ({ notification }: ToastNotificationProps) => {
    const { applyStyle } = useNativeStyles();
    const dispatch = useDispatch();
    const { variant, icon, message } = notification;
    const { backgroundColor, iconBackgroundColor, textColor, iconColor } =
        toastVariantToStyleMap[variant];

    useEffect(() => {
        const timeout = setTimeout(
            () => dispatch(removeToastNotification(notification)),
            TOAST_VISIBLE_DURATION,
        );

        return () => clearTimeout(timeout);
    }, [dispatch, notification]);

    return (
        <Animated.View
            entering={FadeIn.duration(TOAST_ANIMATION_DURATION)}
            exiting={FadeOut.duration(TOAST_ANIMATION_DURATION)}
            style={applyStyle(ToastContainerStyle, { backgroundColor })}
        >
            <HStack spacing={12} alignItems="center">
                <Box
                    style={applyStyle(IconContainerStyle, {
                        backgroundColor: iconBackgroundColor,
                        isDefaultVariant: variant === 'default',
                    })}
                >
                    <Icon name={icon} color={iconColor} size="medium" />
                </Box>
                <Text color={textColor}>{message}</Text>
            </HStack>
        </Animated.View>
    );
};
