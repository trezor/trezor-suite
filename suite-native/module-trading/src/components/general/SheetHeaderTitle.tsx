import { ReactNode } from 'react';

import { RequireAllOrNone } from 'type-fest';

import { Box, HStack, IconButton, Text } from '@suite-native/atoms';
import { IconName } from '@suite-native/icons';

export type SheetHeaderTitleProps = {
    children: ReactNode;
} & RequireAllOrNone<{
    onLeftButtonPress: () => void;
    leftButtonIcon: IconName;
    leftButtonA11yLabel: string;
}>;

export const SheetHeaderTitle = ({
    onLeftButtonPress,
    leftButtonIcon,
    leftButtonA11yLabel,
    children,
}: SheetHeaderTitleProps) => (
    <HStack alignItems="center" justifyContent="space-between">
        {leftButtonIcon && (
            <Box flex={1}>
                <IconButton
                    iconName={leftButtonIcon}
                    onPress={onLeftButtonPress}
                    colorScheme="tertiaryElevation0"
                    size="medium"
                    accessibilityRole="button"
                    accessibilityLabel={leftButtonA11yLabel}
                />
            </Box>
        )}
        <Box flex={3}>
            <Text variant="highlight" textAlign="center" ellipsizeMode="tail" numberOfLines={1}>
                {children}
            </Text>
        </Box>
        {leftButtonIcon && <Box flex={1} />}
    </HStack>
);
