import { type ReactNode, useState } from 'react';
import { Pressable } from 'react-native';

import { Icon } from '@suite-native/icons';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { Box } from '../Box';
import { HStack } from '../Stack';
import { Text } from '../Text';

export type CollapsibleCardProps = {
    title: ReactNode;
    isCollapsed?: boolean;
    children: ReactNode;
};

const cardStyle = prepareNativeStyle(({ borders, colors, spacings }) => ({
    borderRadius: borders.radii.r16,
    outlineWidth: borders.widths.small,
    outlineColor: colors.surfaceBorderSunken,
    backgroundColor: colors.surfaceFillSunken,
    paddingHorizontal: spacings.sp16,
    paddingVertical: spacings.sp12,
}));

export const CollapsibleCard = ({ title, isCollapsed, children }: CollapsibleCardProps) => {
    const { applyStyle } = useNativeStyles();

    const [isContentVisible, setIsContentVisible] = useState(!isCollapsed);

    return (
        <Box style={applyStyle(cardStyle)}>
            <Pressable onPress={() => setIsContentVisible(!isContentVisible)}>
                <HStack justifyContent="space-between">
                    <Text>{title}</Text>
                    <Icon
                        name={isContentVisible ? 'caretUpDownReverse' : 'caretUpDown'}
                        size="mediumLarge"
                        color="contentSecondary"
                    />
                </HStack>
            </Pressable>
            {isContentVisible && (
                <Box marginTop="sp16" marginBottom="sp4">
                    {children}
                </Box>
            )}
        </Box>
    );
};
