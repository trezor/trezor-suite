import { type ReactNode } from 'react';

import { Icon } from '@suite-native/icons';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { Box } from '../Box';
import { type TextInputType } from '../Input/Input';
import { PressableOpacity } from '../Pressable';
import { ACCESSIBILITY_FONTSIZE_MULTIPLIER, Text } from '../Text';

type SelectTriggerProps = {
    labelType?: TextInputType;
    label?: ReactNode;
    value: string | null;
    icon?: ReactNode;
    handlePress: () => void;
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
                outlineWidth: utils.borders.widths.large,
            },
        },
    ],
}));

export const SelectTrigger = ({
    labelType = 'noLabel',
    label,
    value,
    icon,
    handlePress,
    hasError = false,
    isDisabled = false,
    testID,
}: SelectTriggerProps) => {
    const { applyStyle } = useNativeStyles();

    const hasValue = value !== null && value !== undefined;
    const isInnerLabel = labelType === 'innerLabel';
    const showMinimizedLabel = isInnerLabel && hasValue;
    const showFullLabel = isInnerLabel && !hasValue;

    const labelColor = isDisabled ? 'contentDisabled' : 'contentTertiary';
    const valueColor = isDisabled ? 'contentDisabled' : 'contentPrimary';

    return (
        <PressableOpacity
            onPress={handlePress}
            style={applyStyle(selectStyle, { hasError, isDisabled })}
            disabled={isDisabled}
            testID={testID}
        >
            <Box flex={1} justifyContent="center">
                {showFullLabel && (
                    <Text variant="body-md" color="contentSecondary" numberOfLines={1}>
                        {label}
                    </Text>
                )}
                {showMinimizedLabel && (
                    <Text variant="body-sm" color={labelColor} numberOfLines={1}>
                        {label}
                    </Text>
                )}
                {hasValue && (
                    <Box flexDirection="row" alignItems="center">
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
                    </Box>
                )}
            </Box>
            <Icon
                size="large"
                color={isDisabled ? 'contentDisabled' : 'contentSecondary'}
                name="caretDown"
            />
        </PressableOpacity>
    );
};
