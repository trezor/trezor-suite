import React from 'react';

import { useNavigation } from '@react-navigation/native';

import { IconButton } from '@suite-native/atoms';
import {
    AccountsStackParamList,
    AccountsStackRoutes,
    ScreenHeader,
    StackNavigationProps,
} from '@suite-native/navigation';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

type AccountDetailScreenHeaderProps = {
    accountName?: string;
    accountKey: string;
};

const headerStyle = prepareNativeStyle(utils => ({
    paddingHorizontal: utils.spacings.medium,
}));

export const AccountDetailScreenHeader = ({
    accountName,
    accountKey,
}: AccountDetailScreenHeaderProps) => {
    const { applyStyle } = useNativeStyles();
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
        <ScreenHeader
            leftIcon={
                <IconButton
                    colorScheme="gray"
                    isRounded
                    size="large"
                    iconName="chevronLeft"
                    onPress={() => navigation.goBack()}
                />
            }
            rightIcon={
                <IconButton
                    colorScheme="gray"
                    isRounded
                    size="large"
                    iconName="settings"
                    onPress={handleSettingsNavigation}
                />
            }
            style={applyStyle(headerStyle)}
            title={accountName}
        />
    );
};
