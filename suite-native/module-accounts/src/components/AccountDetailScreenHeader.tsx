import React from 'react';

import { useNavigation } from '@react-navigation/native';

import { IconButton, Box, Text } from '@suite-native/atoms';

type AccountDetailScreenHeaderProps = {
    accountName?: string;
};

export const AccountDetailScreenHeader = ({ accountName }: AccountDetailScreenHeaderProps) => {
    const navigation = useNavigation();
    return (
        <Box flexDirection="row" justifyContent="space-between" alignItems="center">
            <IconButton
                colorScheme="gray"
                isRounded
                size="large"
                iconName="chevronLeft"
                onPress={() => navigation.goBack()}
            />
            <Text>{accountName}</Text>
            <IconButton
                colorScheme="gray"
                isRounded
                size="large"
                iconName="settings"
                onPress={() => {}}
            />
        </Box>
    );
};
