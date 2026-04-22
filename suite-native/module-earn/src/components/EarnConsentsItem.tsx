import { type ReactNode } from 'react';

import { HStack, OrderedListIcon, Text } from '@suite-native/atoms';
import { type IconName } from '@suite-native/icons';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';
import { type Color } from '@trezor/theme';

const textStyle = prepareNativeStyle(() => ({
    flex: 1,
}));

type EarnConsentsItemProps = {
    iconName: IconName;
    children: ReactNode;
    color?: Color;
};

export const EarnConsentsItem = ({
    iconName,
    children,
    color = 'contentSecondary',
}: EarnConsentsItemProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <HStack spacing="sp12" alignItems="center">
            <OrderedListIcon
                iconName={iconName}
                iconSize="large"
                iconColor="contentInfo"
                iconBackgroundColor="legacyBackgroundAlertBlueSubtleOnElevation1"
                iconBorderColor="legacyBackgroundAlertBlueSubtleOnElevation0"
            />
            <Text variant="body-sm-strong" color={color} style={applyStyle(textStyle)}>
                {children}
            </Text>
        </HStack>
    );
};
