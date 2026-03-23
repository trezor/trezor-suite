import React, { type ReactNode } from 'react';

import { Box, HStack, Text } from '@suite-native/atoms';
import { Icon, type IconName } from '@suite-native/icons';
import { type Color } from '@trezor/theme';

type InfoLineItemProps = {
    iconName: IconName;
    text: ReactNode;
    textColor?: Color;
    iconColor?: Color;
    textRight?: ReactNode;
};

export const InfoLineItem = ({
    iconName,
    text,
    textColor,
    iconColor,
    textRight,
}: InfoLineItemProps) => (
    <HStack justifyContent="space-between" alignItems="center" paddingVertical="sp2">
        <Box flex={0}>
            <Icon name={iconName} size="medium" color={iconColor || 'iconSubdued'} />
        </Box>
        <Box flex={1}>
            <Text variant="body-sm" color={textColor || 'textSubdued'}>
                {text}
            </Text>
        </Box>
        <Box flex={0}>
            <Text variant="body-sm" color={textColor || 'textDefault'} textAlign="right">
                {textRight}
            </Text>
        </Box>
    </HStack>
);
