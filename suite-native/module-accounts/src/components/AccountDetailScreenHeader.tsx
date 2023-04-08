import React from 'react';

import { useNavigation } from '@react-navigation/native';

import { IconButton } from '@suite-native/atoms';
import {
    AccountsStackParamList,
    AccountsStackRoutes,
    RootStackParamList,
    RootStackRoutes,
    ScreenHeader,
    StackToStackCompositeNavigationProps,
} from '@suite-native/navigation';

type AccountDetailScreenHeaderProps = {
    accountLabel?: string;
    accountKey: string;
    tokenName?: string;
};

type AccountDetailNavigationProps = StackToStackCompositeNavigationProps<
    AccountsStackParamList,
    AccountsStackRoutes.AccountDetail,
    RootStackParamList
>;

export const AccountDetailScreenHeader = ({
    accountLabel,
    accountKey,
    tokenName,
}: AccountDetailScreenHeaderProps) => {
    const navigation = useNavigation<AccountDetailNavigationProps>();

    const handleSettingsNavigation = () => {
        navigation.navigate(RootStackRoutes.AccountSettings, {
            accountKey,
        });
    };

    const isTokenAccount = !!tokenName;
    const accountTitle = isTokenAccount ? `${accountLabel} ${tokenName}` : accountLabel;
    return (
        <ScreenHeader
            hasGoBackIcon
            rightIcon={
                !isTokenAccount && (
                    <IconButton
                        colorScheme="tertiaryElevation0"
                        size="medium"
                        iconName="settings"
                        onPress={handleSettingsNavigation}
                    />
                )
            }
            titleVariant="body"
            title={accountTitle}
        />
    );
};
