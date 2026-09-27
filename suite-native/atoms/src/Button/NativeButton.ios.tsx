import { useWindowDimensions } from 'react-native';

import { Button, HStack, Host, Text } from '@expo/ui/swift-ui';
import {
    buttonBorderShape,
    buttonStyle,
    controlSize,
    disabled,
    font,
    frame,
    lineLimit,
    tint,
    underline,
} from '@expo/ui/swift-ui/modifiers';

import { isDarkColor, useNativeStyles } from '@trezor/styles-native';

import { NativeButtonContainer } from './NativeButtonContainer';
import { type NativeButtonProps } from './nativeButtonTypes';
import { type ButtonSize } from './types';
import { getButtonColors, getTextButtonColor, textButtonTypographyMap } from './utils';

const controlSizeMap = {
    small: 'small',
    medium: 'regular',
    large: 'large',
} as const satisfies Record<ButtonSize, Parameters<typeof controlSize>[0]>;

export const supportsNativeButton = true;

export const NativeButton = ({
    children,
    onPress,
    size,
    intent,
    priority = 'primary',
    isInverse,
    variant = 'button',
    textLabel,
    isUnderlined = false,
    ...containerProps
}: NativeButtonProps) => {
    const { utils } = useNativeStyles();
    const { fontScale } = useWindowDimensions();
    const { isDisabled } = containerProps;
    const { backgroundColor, contentColor } = getButtonColors({
        intent,
        priority,
        isInverse,
        isDisabled: false,
    });
    const filledStyle = priority === 'primary' ? 'borderedProminent' : 'bordered';
    const nativeTint = priority === 'primary' ? backgroundColor : contentColor;

    return (
        <NativeButtonContainer
            {...containerProps}
            size={size}
            onPress={onPress}
            hideLabel={textLabel !== undefined}
            control={
                <Host
                    colorScheme={isDarkColor(utils.colors.surfaceFillPage) ? 'dark' : 'light'}
                    ignoreSafeArea="all"
                    style={{ flex: 1 }}
                >
                    <Button
                        onPress={isDisabled ? undefined : onPress}
                        modifiers={[
                            buttonStyle(variant === 'text' ? 'borderless' : filledStyle),
                            ...(variant === 'icon' ? [buttonBorderShape('circle')] : []),
                            controlSize(controlSizeMap[size]),
                            tint(
                                utils.colors[
                                    variant === 'text'
                                        ? getTextButtonColor({
                                              intent,
                                              priority,
                                              isInverse,
                                              isPressed: false,
                                          })
                                        : nativeTint
                                ],
                            ),
                            disabled(isDisabled),
                        ]}
                    >
                        <HStack modifiers={[frame({ maxWidth: Infinity, maxHeight: Infinity })]}>
                            {textLabel !== undefined && (
                                <Text
                                    modifiers={[
                                        font({
                                            weight: 'regular',
                                            size:
                                                utils.typography[
                                                    textButtonTypographyMap[
                                                        size === 'small' ? 'small' : 'large'
                                                    ]
                                                ].fontSize * fontScale,
                                        }),
                                        lineLimit(1),
                                        underline({ isActive: isUnderlined, pattern: 'solid' }),
                                    ]}
                                >
                                    {textLabel}
                                </Text>
                            )}
                        </HStack>
                    </Button>
                </Host>
            }
        >
            {children}
        </NativeButtonContainer>
    );
};
