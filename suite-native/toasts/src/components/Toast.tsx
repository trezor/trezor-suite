import { useEffect } from 'react';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { Box, HStack, Text } from '@suite-native/atoms';
import { Icon } from '@suite-native/icons';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';
import { type Color } from '@trezor/theme';

import { type ToastIntent, type Toast as ToastInterface } from '../toastsAtoms';
import { useToast } from '../useToast';

type ToastProps = {
    toast: ToastInterface;
};

const TOAST_VISIBLE_DURATION = 1500;
const TOAST_ANIMATION_DURATION = 500;

type ToastStyle = {
    backgroundColor: Color;
    borderColor: Color;
    iconBackgroundColor: Color;
    contentColor: Color;
};

const ToastContainerStyle = prepareNativeStyle<{
    backgroundColor: Color;
    borderColor: Color;
    hasIcon: boolean;
}>((utils, { backgroundColor, borderColor, hasIcon }) => ({
    backgroundColor: utils.colors[backgroundColor],
    borderWidth: 1,
    borderColor: utils.colors[borderColor],
    paddingVertical: utils.spacings.sp4,
    paddingLeft: utils.spacings.sp4,
    paddingRight: utils.spacings.sp16,
    borderRadius: utils.borders.radii.round,
    ...utils.boxShadows.medium,
    extend: [
        {
            condition: !hasIcon,
            style: {
                paddingLeft: utils.spacings.sp16,
                paddingVertical: 14,
            },
        },
    ],
}));

const IconContainerStyle = prepareNativeStyle<{ backgroundColor: Color }>(
    (utils, { backgroundColor }) => ({
        padding: utils.spacings.sp12,
        borderRadius: utils.borders.radii.round,
        backgroundColor: utils.colors[backgroundColor],
    }),
);

const toastIntentToStyleMap = {
    neutral: {
        backgroundColor: 'surfaceFillModelessNeutralDark',
        borderColor: 'surfaceBorderModelessNeutralDark',
        iconBackgroundColor: 'elementFillOnDarkNeutralSoft',
        contentColor: 'contentOnDarkPrimary',
    },
    brand: {
        backgroundColor: 'surfaceFillModelessBrand',
        borderColor: 'surfaceBorderModelessBrand',
        iconBackgroundColor: 'elementFillBrandSoft',
        contentColor: 'contentBrand',
    },
    warning: {
        backgroundColor: 'surfaceFillModelessWarning',
        borderColor: 'surfaceBorderModelessWarning',
        iconBackgroundColor: 'elementFillWarningSoft',
        contentColor: 'contentWarning',
    },
    critical: {
        backgroundColor: 'surfaceFillModelessCritical',
        borderColor: 'surfaceBorderModelessCritical',
        iconBackgroundColor: 'elementFillCriticalSoft',
        contentColor: 'contentCritical',
    },
    info: {
        backgroundColor: 'surfaceFillModelessInfo',
        borderColor: 'surfaceBorderModelessInfo',
        iconBackgroundColor: 'elementFillInfoSoft',
        contentColor: 'contentInfo',
    },
} as const satisfies Record<ToastIntent, ToastStyle>;

export const Toast = ({ toast }: ToastProps) => {
    const { hideToast } = useToast();
    const { applyStyle } = useNativeStyles();
    const { intent, icon, message } = toast;
    const { backgroundColor, borderColor, iconBackgroundColor, contentColor } =
        toastIntentToStyleMap[intent];

    useEffect(() => {
        const timeout = setTimeout(() => hideToast(toast.id), TOAST_VISIBLE_DURATION);

        return () => clearTimeout(timeout);
    }, [toast, hideToast]);

    return (
        <Animated.View
            entering={FadeIn.duration(TOAST_ANIMATION_DURATION)}
            exiting={FadeOut.duration(TOAST_ANIMATION_DURATION)}
            style={applyStyle(ToastContainerStyle, {
                backgroundColor,
                borderColor,
                hasIcon: !!icon,
            })}
        >
            <HStack spacing="sp12" alignItems="center">
                {icon && (
                    <Box
                        style={applyStyle(IconContainerStyle, {
                            backgroundColor: iconBackgroundColor,
                        })}
                    >
                        <Icon name={icon} color={contentColor} size="medium" />
                    </Box>
                )}
                <Text color={contentColor} variant="body-sm" testID="@toast">
                    {message}
                </Text>
            </HStack>
        </Animated.View>
    );
};
