import { type ReactNode } from 'react';

import { Box, HStack, Text } from '@suite-native/atoms';
import { Icon } from '@suite-native/icons';
import { Link } from '@suite-native/link';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';
import { type Color, type NativeTypographyStyle } from '@trezor/theme';

const shrinkableStyle = prepareNativeStyle(() => ({
    flexShrink: 1,
    minWidth: 0,
    textAlign: 'right',
}));

export type TradeStatusSubItemProps = {
    label: ReactNode;
    value?: ReactNode;
    onPress?: () => void;
    textVariant?: NativeTypographyStyle;
    color?: Color;
};

export const TradeStatusSubItem = ({
    label,
    value,
    onPress,
    textVariant = 'body-sm',
    color = 'contentSecondary',
}: TradeStatusSubItemProps) => {
    const { applyStyle } = useNativeStyles();
    const isLabelText = typeof label === 'string' || typeof label === 'number';
    const isValueText = typeof value === 'string' || typeof value === 'number';

    const renderValue = isValueText ? (
        <Text variant={textVariant} color={color} numberOfLines={1} ellipsizeMode="tail">
            {value}
        </Text>
    ) : (
        value
    );

    if (value !== undefined) {
        return (
            <HStack spacing="sp64" justifyContent="space-between" alignItems="center">
                <Text variant={textVariant} color={color}>
                    {label}
                </Text>
                {onPress ? (
                    <HStack spacing={0} alignItems="center" style={applyStyle(shrinkableStyle)}>
                        <Box flexShrink={1}>
                            <Link
                                ellipsizeMode="middle"
                                isUnderlined
                                textVariant="body-sm"
                                label={value}
                                onPress={onPress}
                                numberOfLines={1}
                                style={applyStyle(shrinkableStyle)}
                            />
                        </Box>
                        <Icon name="caretRight" size={20} />
                    </HStack>
                ) : (
                    renderValue
                )}
            </HStack>
        );
    }

    return isLabelText ? (
        <Text variant={textVariant} color={color}>
            {label}
        </Text>
    ) : (
        label
    );
};
