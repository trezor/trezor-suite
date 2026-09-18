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
    hasError?: boolean;
    testID?: string;
};

type StyleProps = {
    hasError: boolean;
};

const selectStyle = prepareNativeStyle<StyleProps>((utils, { hasError }) => ({
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: utils.colors.elementFillField,
    borderWidth: utils.borders.widths.small,
    borderRadius: utils.borders.radii.r12,
    borderColor: utils.colors.elementBorderField,
    color: utils.colors.contentSecondary,
    paddingLeft: utils.spacings.sp12,
    paddingRight: 23.25,
    height: 58 * ACCESSIBILITY_FONTSIZE_MULTIPLIER,
    extend: [
        {
            condition: hasError,
            style: {
                borderColor: utils.colors.elementBorderFieldError,
            },
        },
    ],
}));

export const SelectTrigger = ({
    label,
    value,
    icon,
    handlePress,
    hasError = false,
    testID,
}: SelectTriggerProps) => {
    const { applyStyle } = useNativeStyles();

    const Wrapper = handlePress ? PressableOpacity : Box;

    return (
        <Wrapper
            onPress={handlePress}
            style={applyStyle(selectStyle, { hasError })}
            testID={testID}
        >
            <Box>
                {label && (
                    <Text variant="body-xs" color="contentSecondary">
                        {label}
                    </Text>
                )}
                <HStack alignItems="center">
                    {icon}
                    <Text numberOfLines={1} ellipsizeMode="tail">
                        {value}
                    </Text>
                </HStack>
            </Box>
            {!!handlePress && <Icon size="large" color="contentSecondary" name="caretDown" />}
        </Wrapper>
    );
};
