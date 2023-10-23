import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/core';

import { IconButton, Text, VStack } from '@suite-native/atoms';
import {
    AccountsImportStackParamList,
    AccountsImportStackRoutes,
    AppTabsRoutes,
    HomeStackRoutes,
    RootStackParamList,
    RootStackRoutes,
    ScreenSubHeader,
    StackToTabCompositeProps,
} from '@suite-native/navigation';
import { selectUserHasAccounts } from '@suite-common/wallet-core';
import { Translation } from '@suite-native/intl';

type NavigationProp = StackToTabCompositeProps<
    AccountsImportStackParamList,
    AccountsImportStackRoutes.AccountImportSummary,
    RootStackParamList
>;

export const AccountImportSubHeader = () => {
    const navigation = useNavigation<NavigationProp>();
    const userHasAccounts = useSelector(selectUserHasAccounts);

    const handleCloseOnboarding = () => {
        navigation.navigate(RootStackRoutes.AppTabs, {
            screen: AppTabsRoutes.HomeStack,
            params: {
                screen: HomeStackRoutes.Home,
            },
        });
    };

    return (
        <ScreenSubHeader
            leftIcon={
                userHasAccounts ? (
                    <IconButton
                        iconName="close"
                        colorScheme="tertiaryElevation0"
                        onPress={handleCloseOnboarding}
                        size="medium"
                    />
                ) : null
            }
            content={
                <VStack alignItems="center" spacing="small">
                    <Text variant="titleSmall" adjustsFontSizeToFit numberOfLines={1}>
                        <Translation id="moduleAccountImport.title" />
                    </Text>
                </VStack>
            }
        />
    );
};
