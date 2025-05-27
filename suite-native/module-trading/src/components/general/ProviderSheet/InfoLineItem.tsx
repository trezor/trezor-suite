import React, { ReactNode } from 'react';

import { HStack, Text } from '@suite-native/atoms';
import { Icon, IconName } from '@suite-native/icons';
import { Color } from '@trezor/theme';

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
        <HStack alignItems="center">
            <Icon name={iconName} size="medium" color={iconColor || 'iconSubdued'} />
            <Text variant="hint" color={textColor || 'textSubdued'}>
                {text}
            </Text>
        </HStack>
        <Text variant="hint" color={textColor || 'textDefault'}>
            {textRight}
        </Text>
    </HStack>
);
