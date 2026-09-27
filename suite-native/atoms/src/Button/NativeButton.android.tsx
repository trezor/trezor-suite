import { Box, Button, FilledTonalButton, Host } from '@expo/ui/jetpack-compose';
import { fillMaxSize } from '@expo/ui/jetpack-compose/modifiers';

import { isDarkColor, useNativeStyles } from '@trezor/styles-native';

import { NativeButtonContainer } from './NativeButtonContainer';
import { type NativeButtonProps } from './nativeButtonTypes';
import { getButtonColors } from './utils';

export const supportsNativeButton = true;

export const NativeButton = ({
    children,
    onPress,
    size,
    intent,
    priority = 'primary',
    isInverse,
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
    const NativeControl = priority === 'primary' ? Button : FilledTonalButton;

    return (
        <NativeButtonContainer
            {...containerProps}
            size={size}
            onPress={onPress}
            control={
                <Host
                    colorScheme={isDarkColor(utils.colors.surfaceFillPage) ? 'dark' : 'light'}
                    seedColor={utils.colors.contentBrand}
                    ignoreSafeAreaKeyboardInsets
                    style={{ flex: 1 }}
                >
                    <NativeControl
                        onClick={isDisabled ? undefined : onPress}
                        enabled={!isDisabled}
                        colors={{
                            containerColor: utils.colors[backgroundColor],
                            contentColor: utils.colors[contentColor],
                            disabledContainerColor: utils.colors[disabledColors.backgroundColor],
                            disabledContentColor: utils.colors[disabledColors.contentColor],
                        }}
                        modifiers={[fillMaxSize()]}
                    >
                        <Box />
                    </NativeControl>
                </Host>
            }
        >
            {children}
        </NativeButtonContainer>
    );
};
