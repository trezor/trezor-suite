import { Platform, StyleSheet, View } from 'react-native';

import { type NativeButtonContainerProps } from './nativeButtonTypes';
import { buttonSizeToDimensionsMap } from './utils';

export const NativeButtonContainer = ({
    children,
    control,
    size,
    isDisabled,
    isLoading,
    isFullWidth,
    flex,
    style,
    onPress,
    onAccessibilityTap,
    onAccessibilityAction,
    accessibilityState,
    accessibilityActions,
    ...viewProps
}: NativeButtonContainerProps) => {
    const handlePress = () => {
        if (!isDisabled) {
            onPress?.();
        }
    };

    return (
        <View
            accessible
            accessibilityRole="button"
            {...viewProps}
            accessibilityState={{ ...accessibilityState, disabled: isDisabled, busy: isLoading }}
            accessibilityActions={accessibilityActions ?? [{ name: 'activate' }]}
            onAccessibilityTap={
                Platform.OS === 'ios'
                    ? () => {
                          if (isDisabled) return;

                          (onAccessibilityTap ?? handlePress)();
                      }
                    : undefined
            }
            onAccessibilityAction={event => {
                if (isDisabled) return;

                if (onAccessibilityAction) {
                    onAccessibilityAction(event);
                } else if (
                    Platform.OS === 'android' &&
                    event.nativeEvent.actionName === 'activate'
                ) {
                    handlePress();
                }
            }}
            style={[
                {
                    flex,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    maxWidth: '100%',
                    ...buttonSizeToDimensionsMap[size],
                },
                isFullWidth && { width: '100%' },
                style,
            ]}
        >
            {/* Keep Yoga layout and label accessibility while the native control owns touch feedback. */}
            <View
                accessible={false}
                accessibilityElementsHidden
                importantForAccessibility="no-hide-descendants"
                style={StyleSheet.absoluteFill}
            >
                {control}
            </View>
            <View pointerEvents="none">{children}</View>
        </View>
    );
};
