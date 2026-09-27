import { View } from 'react-native';

import { Icon } from '@suite-native/icons';
import { type NativeStyleObject, prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { Loader } from '../Loader';
import { LegacyIconButton, type LegacyIconButtonProps } from './LegacyIconButton';
import { NativeButton, supportsNativeButton } from './NativeButton';
import { hasUnsupportedNativeButtonProps } from './hasUnsupportedNativeButtonProps';
import { type ButtonSize } from './types';
import {
    getButtonColors,
    iconButtonBorderRadiusMap,
    iconButtonPaddingMap,
    iconButtonToIconSizeMap,
} from './utils';

type NativeIconButtonProps = Omit<LegacyIconButtonProps, 'onPress' | 'style'> & {
    onPress?: () => void;
    style?: NativeStyleObject;
    accessibilityLabel: string;
};

export type IconButtonProps =
    (NativeIconButtonProps & { native: true }) | (LegacyIconButtonProps & { native?: false });

const nativeIconButtonStyle = prepareNativeStyle<{ size: ButtonSize }>((_, { size }) => ({
    alignSelf: 'center',
    paddingVertical: iconButtonPaddingMap[size],
    paddingHorizontal: iconButtonPaddingMap[size],
    borderRadius: iconButtonBorderRadiusMap[size],
}));

const NativeIconButton = ({
    iconName,
    testID,
    style,
    intent = 'brand',
    priority = 'primary',
    isInverse = false,
    size = 'large',
    isLoading = false,
    isDisabled = false,
    disabled,
    ...pressableProps
}: NativeIconButtonProps) => {
    const { applyStyle } = useNativeStyles();
    const hasDisabledState = isDisabled || !!disabled || isLoading;
    const { contentColor } = getButtonColors({
        intent,
        priority,
        isInverse,
        isDisabled: hasDisabledState,
    });

    return (
        <NativeButton
            {...pressableProps}
            intent={intent}
            priority={priority}
            isInverse={isInverse}
            variant="icon"
            size={size}
            isDisabled={hasDisabledState}
            isLoading={isLoading}
            isFullWidth={false}
            testID={testID}
            style={[applyStyle(nativeIconButtonStyle, { size }), style]}
        >
            <View
                accessible={false}
                accessibilityElementsHidden
                importantForAccessibility="no-hide-descendants"
            >
                {isLoading ? (
                    <View testID={testID ? `${testID}/loading` : undefined}>
                        <Loader color={contentColor} />
                    </View>
                ) : (
                    <Icon
                        name={iconName}
                        color={contentColor}
                        size={iconButtonToIconSizeMap[size]}
                    />
                )}
            </View>
        </NativeButton>
    );
};

export const IconButton = (props: IconButtonProps) => {
    if (props.native) {
        const { native: _, ...nativeProps } = props;

        if (supportsNativeButton && !hasUnsupportedNativeButtonProps(props)) {
            return <NativeIconButton {...nativeProps} />;
        }

        return (
            <LegacyIconButton
                {...nativeProps}
                onPress={props.onPress ? () => props.onPress?.() : undefined}
            />
        );
    }

    const { native: _, ...legacyProps } = props;

    return <LegacyIconButton {...legacyProps} />;
};
