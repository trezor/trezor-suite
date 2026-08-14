import { type ReactNode } from 'react';

import { Icon } from '@suite-native/icons';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { Box } from '../Box';
import { PressableOpacity } from '../Pressable';
import { HStack } from '../Stack';
import { ACCESSIBILITY_FONTSIZE_MULTIPLIER, Text } from '../Text';

type SelectTriggerProps = {
    label?: ReactNode;
    value: string | null;
    icon?: ReactNode;
    handlePress?: () => void;
    rightIcon?: ReactNode;
    hasError?: boolean;
    isDisabled?: boolean;
    testID?: string;
};

const SELECT_MIN_HEIGHT = 56 * ACCESSIBILITY_FONTSIZE_MULTIPLIER;

type SelectStyleProps = {
    hasError: boolean;
    isDisabled: boolean;
};

const selectStyle = prepareNativeStyle<SelectStyleProps>((utils, { hasError, isDisabled }) => ({
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: utils.spacings.sp16,
    paddingVertical: utils.spacings.sp6,
    backgroundColor: utils.colors.elementFillField,
    outlineStyle: 'solid',
    outlineWidth: utils.borders.widths.small,
    outlineColor: utils.colors.elementBorderField,
    borderRadius: utils.borders.radii.r12,
    minHeight: SELECT_MIN_HEIGHT,
    extend: [
        {
            condition: isDisabled,
            style: {
                backgroundColor: utils.colors.elementFillFieldDisabled,
                outlineColor: utils.colors.elementBorderFieldDisabled,
            },
        },
        {
            condition: hasError && !isDisabled,
            style: {
                outlineColor: utils.colors.elementBorderFieldError,
            },
        },
    ],
}));

export const SelectTrigger = ({
    label,
    value,
    icon,
    handlePress,
    rightIcon,
    hasError = false,
    isDisabled = false,
    testID,
}: SelectTriggerProps) => {
    const { applyStyle } = useNativeStyles();

    const hasValue = value !== null && value !== undefined;
    const hasLabel = !!label;
    const showMinimizedLabel = hasLabel && hasValue;
    const showFullLabel = hasLabel && !hasValue;

    const fullLabelColor = isDisabled ? 'contentDisabled' : 'contentSecondary';
    const minimizedLabelColor = isDisabled ? 'contentDisabled' : 'contentTertiary';
    const valueColor = isDisabled ? 'contentDisabled' : 'contentPrimary';

    const Wrapper = handlePress ? PressableOpacity : Box;

    return (
        <Wrapper
            onPress={handlePress}
            style={applyStyle(selectStyle, { hasError, isDisabled })}
            disabled={isDisabled}
            testID={testID}
        >
            <Box flex={1} justifyContent="center">
                {showFullLabel && (
                    <Text variant="body-md" color={fullLabelColor} numberOfLines={1}>
                        {label}
                    </Text>
                )}
                {showMinimizedLabel && (
                    <Text variant="body-sm" color={minimizedLabelColor} numberOfLines={1}>
                        {label}
                    </Text>
                )}
                {hasValue && (
                    <HStack alignItems="center">
                        {icon}
                        <Text
                            variant="body-md"
                            color={valueColor}
                            numberOfLines={1}
                            ellipsizeMode="tail"
                            style={{ flex: 1 }}
                        >
                            {value}
                        </Text>
                    </HStack>
                )}
            </Box>
            {handlePress ? (
                <Icon
                    size="large"
                    color={isDisabled ? 'contentDisabled' : 'contentPrimary'}
                    name="caretDown"
                />
            ) : (
                rightIcon
            )}
        </Wrapper>
    );
};
