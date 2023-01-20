import React from 'react';

import { useNavigation } from '@react-navigation/native';

import { Text, VStack } from '@suite-native/atoms';
import { AccountsList } from '@suite-native/accounts';
import {
    AppTabsParamList,
    AppTabsRoutes,
    RootStackRoutes,
    Screen,
    ScreenHeader,
    RootStackParamList,
    TabToStackCompositeNavigationProp,
} from '@suite-native/navigation';

type ReceiveAccountsNavigationProps = TabToStackCompositeNavigationProp<
    AppTabsParamList,
    AppTabsRoutes.ReceiveScreen,
    RootStackParamList
>;

export const ReceiveAccountsScreen = () => {
    const navigation = useNavigation<ReceiveAccountsNavigationProps>();
    return (
        <Screen header={<ScreenHeader title="Receive" hasGoBackIcon={false} />}>
            <VStack spacing="small">
                <Text variant="highlight">To account</Text>
                <AccountsList
                    onSelectAccount={accountKey =>
                        navigation.navigate(RootStackRoutes.ReceiveModal, { accountKey })
                    }
                />
            </VStack>
        </Screen>
    );
};
