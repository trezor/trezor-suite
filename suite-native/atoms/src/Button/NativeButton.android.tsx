import {
    Box,
    Button,
    FilledIconButton,
    FilledTonalButton,
    FilledTonalIconButton,
    Host,
    Text,
    TextButton,
} from '@expo/ui/jetpack-compose';
import { fillMaxSize } from '@expo/ui/jetpack-compose/modifiers';

import { isDarkColor, useNativeStyles } from '@trezor/styles-native';

import { NativeButtonContainer } from './NativeButtonContainer';
import { type NativeButtonProps } from './nativeButtonTypes';
import {
    getButtonColors,
    getTextButtonColor,
    getTextButtonDisabledColor,
    textButtonTypographyMap,
} from './utils';

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
    const { isDisabled } = containerProps;
    const { backgroundColor, contentColor } = getButtonColors({
        intent,
        priority,
        isInverse,
        isDisabled: false,
    });
    const disabledColors = getButtonColors({ intent, priority, isInverse, isDisabled: true });
    const controls = {
        button: priority === 'primary' ? Button : FilledTonalButton,
        icon: priority === 'primary' ? FilledIconButton : FilledTonalIconButton,
        text: TextButton,
    };
    const NativeControl = controls[variant];
    const nativeContentColor =
        variant === 'text'
            ? getTextButtonColor({ intent, priority, isInverse, isPressed: false })
            : contentColor;
    const nativeDisabledContentColor =
        variant === 'text' ? getTextButtonDisabledColor(!!isInverse) : disabledColors.contentColor;

    return (
        <NativeButtonContainer
            {...containerProps}
            size={size}
            onPress={onPress}
            hideLabel={textLabel !== undefined}
            control={
                <Host
                    colorScheme={isDarkColor(utils.colors.surfaceFillPage) ? 'dark' : 'light'}
                    seedColor={utils.colors.contentBrand}
                    ignoreSafeAreaKeyboardInsets
                    style={{ flex: 1 }}
                >
                    <NativeControl
                        {...(variant === 'text'
                            ? { contentPadding: { start: 0, end: 0, top: 0, bottom: 0 } }
                            : {})}
                        onClick={isDisabled ? undefined : onPress}
                        enabled={!isDisabled}
                        colors={{
                            containerColor:
                                variant === 'text' ? 'transparent' : utils.colors[backgroundColor],
                            contentColor: utils.colors[nativeContentColor],
                            disabledContainerColor:
                                variant === 'text'
                                    ? 'transparent'
                                    : utils.colors[disabledColors.backgroundColor],
                            disabledContentColor: utils.colors[nativeDisabledContentColor],
                        }}
                        modifiers={[fillMaxSize()]}
                    >
                        {textLabel === undefined ? (
                            <Box />
                        ) : (
                            <Text
                                color={
                                    utils.colors[
                                        isDisabled ? nativeDisabledContentColor : nativeContentColor
                                    ]
                                }
                                style={{
                                    fontWeight: 'normal',
                                    letterSpacing: 0,
                                    fontSize:
                                        utils.typography[
                                            textButtonTypographyMap[
                                                size === 'small' ? 'small' : 'large'
                                            ]
                                        ].fontSize,
                                    textDecoration: isUnderlined ? 'underline' : 'none',
                                }}
                                maxLines={1}
                            >
                                {textLabel}
                            </Text>
                        )}
                    </NativeControl>
                </Host>
            }
        >
            {children}
        </NativeButtonContainer>
    );
};
