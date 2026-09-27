import { Button, HStack, Host } from '@expo/ui/swift-ui';
import { buttonStyle, controlSize, disabled, frame, tint } from '@expo/ui/swift-ui/modifiers';

import { isDarkColor, useNativeStyles } from '@trezor/styles-native';

import { NativeButtonContainer } from './NativeButtonContainer';
import { type NativeButtonProps } from './nativeButtonTypes';
import { type ButtonSize } from './types';
import { getButtonColors } from './utils';

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

    return (
        <NativeButtonContainer
            {...containerProps}
            size={size}
            onPress={onPress}
            control={
                <Host
                    colorScheme={isDarkColor(utils.colors.surfaceFillPage) ? 'dark' : 'light'}
                    ignoreSafeArea="all"
                    style={{ flex: 1 }}
                >
                    <Button
                        onPress={isDisabled ? undefined : onPress}
                        modifiers={[
                            buttonStyle(priority === 'primary' ? 'borderedProminent' : 'bordered'),
                            controlSize(controlSizeMap[size]),
                            tint(
                                utils.colors[
                                    priority === 'primary' ? backgroundColor : contentColor
                                ],
                            ),
                            disabled(isDisabled),
                        ]}
                    >
                        <HStack modifiers={[frame({ maxWidth: Infinity, maxHeight: Infinity })]} />
                    </Button>
                </Host>
            }
        >
            {children}
        </NativeButtonContainer>
    );
};
