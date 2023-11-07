import { useNavigation } from '@react-navigation/core';

import { Box, Button, Card, Divider } from '@suite-native/atoms';
import { AccountListItem } from '@suite-native/accounts';
import { Account } from '@suite-common/wallet-types';
import {
    AccountsImportStackParamList,
    AccountsImportStackRoutes,
    AppTabsRoutes,
    HomeStackRoutes,
    RootStackParamList,
    RootStackRoutes,
    StackToTabCompositeProps,
} from '@suite-native/navigation';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

type AccountImportImportedAccountProps = {
    account: Account;
};

const contentWrapperStyle = prepareNativeStyle(() => ({
    marginBottom: 114,
}));

// TODO We shouldn't add navigation props to components like this.
// Navigation hook should be typed properly to handle this.
type NavigationProp = StackToTabCompositeProps<
    AccountsImportStackParamList,
    AccountsImportStackRoutes.AccountImportSummary,
    RootStackParamList
>;

export const AccountAlreadyImported = ({ account }: AccountImportImportedAccountProps) => {
    const { applyStyle } = useNativeStyles();
    const navigation = useNavigation<NavigationProp>();

    const handleImportAnotherAsset = () =>
        navigation.navigate(RootStackRoutes.AccountsImport, {
            screen: AccountsImportStackRoutes.XpubScan,
            params: {
                networkSymbol: account.symbol,
            },
        });

    const handleNavigateToDashboard = () =>
        navigation.navigate(RootStackRoutes.AppTabs, {
            screen: AppTabsRoutes.HomeStack,
            params: {
                screen: HomeStackRoutes.Home,
            },
        });

    return (
        <Box flex={1} justifyContent="flex-end">
            <Card style={applyStyle(contentWrapperStyle)}>
                {account && <AccountListItem account={account} />}
            </Card>
            <Box>
                <Box marginBottom="large" marginTop="large">
                    <Divider />
                </Box>
                <Box>
                    <Box marginBottom="m">
                        <Button
                            size="large"
                            colorScheme="tertiaryElevation0"
                            onPress={handleImportAnotherAsset}
                        >
                            Import another asset
                        </Button>
                    </Box>
                    <Button size="large" onPress={handleNavigateToDashboard}>
                        Continue to app
                    </Button>
                </Box>
            </Box>
        </Box>
    );
};
