import { Platform, Text } from 'react-native';

import { useTranslate } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { getNativeTextLabel } from '../getNativeTextLabel';
import { LegacyTextButton, type LegacyTextButtonProps } from './LegacyTextButton';
import { NativeButton, supportsNativeButton } from './NativeButton';
import { hasUnsupportedNativeButtonProps } from './hasUnsupportedNativeButtonProps';
import { type NativeButtonPressProps } from './nativeButtonTypes';
import { type TextButtonSize } from './types';
import { getTextButtonColor, getTextButtonDisabledColor, textButtonTypographyMap } from './utils';

export { TEXT_BUTTON_SIZES } from './types';

export type TextButtonProps = Omit<LegacyTextButtonProps, 'onPress'> & NativeButtonPressProps;

type NativeTextButtonProps = Omit<LegacyTextButtonProps, 'onPress'> & { onPress?: () => void };

const nativeTextButtonStyle = prepareNativeStyle(() => ({
    alignSelf: 'center',
    maxWidth: '100%',
    paddingVertical: 0,
    paddingHorizontal: 0,
    borderRadius: 0,
}));

const labelStyle = prepareNativeStyle<{ size: TextButtonSize; isUnderlined: boolean }>(
    (utils, { size, isUnderlined }) => ({
        ...utils.typography[textButtonTypographyMap[size]],
        fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
        fontWeight: 'normal',
        letterSpacing: 0,
        flexShrink: 1,
        textDecorationLine: isUnderlined ? 'underline' : 'none',
    }),
);

const NativeTextButton = (props: NativeTextButtonProps) => {
    const {
        children,
        disabled,
        iconLeft,
        iconRight,
        intent = 'neutral',
        isDisabled = false,
        isInverse = false,
        isLoading = false,
        isUnderlined = false,
        isDotted = false,
        priority = 'primary',
        size = 'large',
        style,
        testID,
        ...pressableProps
    } = props;
    const { applyStyle, utils } = useNativeStyles();
    const { translate } = useTranslate();
    const textLabel = getNativeTextLabel({ label: children, translate });

    // The native label must own its pressed appearance. Custom content keeps its RN renderer.
    if (
        !supportsNativeButton ||
        hasUnsupportedNativeButtonProps(props) ||
        textLabel === null ||
        iconLeft ||
        iconRight ||
        isLoading ||
        isDotted
    ) {
        return (
            <LegacyTextButton
                {...props}
                accessibilityLabel={props.accessibilityLabel ?? textLabel ?? undefined}
                onPress={props.onPress ? () => props.onPress?.() : undefined}
            />
        );
    }

    const hasDisabledState = isDisabled || !!disabled;
    const contentColor = hasDisabledState
        ? getTextButtonDisabledColor(isInverse)
        : getTextButtonColor({ intent, priority, isInverse, isPressed: false });

    return (
        <NativeButton
            {...pressableProps}
            accessibilityLabel={pressableProps.accessibilityLabel ?? textLabel}
            intent={intent}
            priority={priority}
            isInverse={isInverse}
            variant="text"
            textLabel={textLabel}
            isUnderlined={isUnderlined}
            size={size}
            isDisabled={hasDisabledState}
            isLoading={false}
            isFullWidth={false}
            style={[applyStyle(nativeTextButtonStyle), style]}
            testID={testID ? `${testID}/button` : undefined}
        >
            <Text
                numberOfLines={1}
                style={[
                    applyStyle(labelStyle, { size, isUnderlined }),
                    { color: utils.colors[contentColor] },
                ]}
                testID={testID ? `${testID}/text` : undefined}
            >
                {children}
            </Text>
        </NativeButton>
    );
};

export const TextButton = (props: TextButtonProps) => {
    if (props.native) {
        const { native: _, ...nativeProps } = props;

        return <NativeTextButton {...nativeProps} />;
    }

    const { native: _, ...legacyProps } = props;

    return <LegacyTextButton {...legacyProps} />;
};
