import React from 'react';

import { useNavigation } from '@react-navigation/native';

import { IconButton, Box, Text } from '@suite-native/atoms';
import {
    AccountsStackParamList,
    AccountsStackRoutes,
    StackNavigationProps,
} from '@suite-native/navigation';

type AccountDetailScreenHeaderProps = {
    accountName?: string;
    accountKey: string;
};

export const AccountDetailScreenHeader = ({
    accountName,
    accountKey,
}: AccountDetailScreenHeaderProps) => {
    const navigation =
        useNavigation<
            StackNavigationProps<AccountsStackParamList, AccountsStackRoutes.AccountDetail>
        >();

    const handleSettingsNavigation = () => {
        navigation.navigate(AccountsStackRoutes.AccountDetailSettings, {
            accountKey,
        });
    };

    return (
        <Box
            flexDirection="row"
            justifyContent="space-between"
            alignItems="center"
            paddingHorizontal="large"
        >
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
                onPress={handleSettingsNavigation}
            />
        </Box>
    );
};
