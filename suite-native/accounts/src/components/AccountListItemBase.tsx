import React from 'react';
import { TouchableOpacity, TouchableOpacityProps } from 'react-native';

import { Box, HStack, Text } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

export type AccountListItemBaseProps = {
    icon: React.ReactNode;
    title: React.ReactNode;
    badges?: React.ReactNode;
    mainValue: React.ReactNode;
    secondaryValue: React.ReactNode;

    onPress?: TouchableOpacityProps['onPress'];
    disabled?: boolean;
};

const accountListItemStyle = prepareNativeStyle(utils => ({
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItem: 'center',

    paddingVertical: 12,
    paddingHorizontal: utils.spacings.medium,
}));

const accountDescriptionStyle = prepareNativeStyle(_ => ({
    flexShrink: 1,
}));

const valuesContainerStyle = prepareNativeStyle(utils => ({
    maxWidth: '40%',
    flexShrink: 0,
    alignItems: 'flex-end',
    paddingLeft: utils.spacings.small,
}));

export const AccountListItemBase = ({
    icon,
    title,
    badges,
    mainValue,
    secondaryValue,
    onPress,
    disabled,
}: AccountListItemBaseProps) => {
    const { applyStyle } = useNativeStyles();

    const BaseComponent = onPress ? TouchableOpacity : Box;

    return (
        <BaseComponent
            style={applyStyle(accountListItemStyle)}
            onPress={onPress}
            disabled={disabled}
        >
            <Box flexDirection="row" alignItems="center" flex={1}>
                <Box marginRight="medium">{icon}</Box>
                <Box style={applyStyle(accountDescriptionStyle)}>
                    <Text>{title}</Text>
                    <HStack spacing="extraSmall" alignItems="center">
                        {badges}
                    </HStack>
                </Box>
            </Box>
            <Box style={applyStyle(valuesContainerStyle)}>
                {mainValue}
                {secondaryValue}
            </Box>
        </BaseComponent>
    );
};
