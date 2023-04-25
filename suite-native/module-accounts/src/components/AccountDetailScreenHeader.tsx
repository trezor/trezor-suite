import React from 'react';

import { useNavigation } from '@react-navigation/native';

import { IconButton } from '@suite-native/atoms';
import {
    AccountsStackParamList,
    HomeStackRoutes,
    RootStackParamList,
    RootStackRoutes,
    ScreenHeader,
    StackToStackCompositeNavigationProps,
} from '@suite-native/navigation';

type AccountDetailScreenHeaderProps = {
    accountLabel?: string;
    accountKey: string;
};

type AccountDetailNavigationProps = StackToStackCompositeNavigationProps<
    AccountsStackParamList,
    HomeStackRoutes.AccountDetail,
    RootStackParamList
>;

export const AccountDetailScreenHeader = ({
    accountLabel,
    accountKey,
}: AccountDetailScreenHeaderProps) => {
    const navigation = useNavigation<AccountDetailNavigationProps>();

    const handleSettingsNavigation = () => {
        navigation.navigate(RootStackRoutes.AccountSettings, {
            accountKey,
        });
    };

    return (
        <ScreenHeader
            hasGoBackIcon
            rightIcon={
                <IconButton
                    colorScheme="tertiaryElevation0"
                    size="medium"
                    iconName="settings"
                    onPress={handleSettingsNavigation}
                />
            }
            titleVariant="body"
            content={accountLabel}
        />
    );
};
