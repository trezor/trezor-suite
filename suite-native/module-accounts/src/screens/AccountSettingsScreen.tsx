import React, { ReactNode, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { networks, NetworkSymbol } from '@suite-common/wallet-config';
import {
    AccountsStackParamList,
    AccountsStackRoutes,
    RootStackParamList,
    RootStackRoutes,
    Screen,
    ScreenHeader,
    StackNavigationProps,
    StackProps,
} from '@suite-native/navigation';
import { BottomSheet, Box, Button, Card, Text, VStack } from '@suite-native/atoms';
import { accountsActions, AccountsRootState, selectAccountByKey } from '@suite-common/wallet-core';
import { QRCode } from '@suite-native/qr-code';
import { CryptoIcon } from '@trezor/icons';
// import { deriveAddresses } from '@trezor/utxo-lib';

const AccountDetailSettingsRow = ({ title, value }: { title: string; value: ReactNode }) => (
    <Box flexDirection="row" justifyContent="space-between">
        <Text variant="hint" color="gray600">
            {title}
        </Text>
        <Text variant="hint" color="gray1000">
            {value}
        </Text>
    </Box>
);

const CryptoNameWithIcon = ({ symbol }: { symbol: NetworkSymbol }) => (
    <Box flexDirection="row" alignItems="center">
        <Text>{networks[symbol].name}</Text>
        <Box marginLeft="small">
            <CryptoIcon name={symbol} size="small" />
        </Box>
    </Box>
);

export const AccountSettingsScreen = ({
    route,
}: StackProps<RootStackParamList, RootStackRoutes.AccountSettings>) => {
    const { accountKey } = route.params;
    const [isXpubVisible, setIsXpubVisible] = useState(false);
    const navigation =
        useNavigation<
            StackNavigationProps<AccountsStackParamList, AccountsStackRoutes.AccountDetailSettings>
        >();
    const dispatch = useDispatch();
    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );

    if (!account) return null;

    const handleRemoveAccount = () => {
        dispatch(accountsActions.removeAccount([account]));
        navigation.navigate(AccountsStackRoutes.Accounts);
    };

    const handleCopyXpubToClipboardAndClose = () => {
        setIsXpubVisible(false);
    };

    // const derivedPaths = deriveAddresses(account.descriptor, 'receive', 0, 1);

    // Derivation path format => m / purpose' / coin_type' / account' / change / index
    // We don't need change & index
    // const derivationPath = derivedPaths[0].path.split('/').slice(0, 4).join('/');

    return (
        <Screen header={<ScreenHeader />}>
            <Box flex={1} justifyContent="space-between">
                <Card>
                    <VStack spacing="large">
                        <AccountDetailSettingsRow
                            title="Coin"
                            value={<CryptoNameWithIcon symbol={account.symbol} />}
                        />
                        {/* <AccountDetailSettingsRow title="Derivation Path" value={derivationPath} /> */}
                    </VStack>
                </Card>
                <VStack spacing="small">
                    <Button onPress={() => setIsXpubVisible(true)} colorScheme="gray">
                        View XPUB
                    </Button>
                    <Button onPress={handleRemoveAccount} colorScheme="red">
                        Remove Account
                    </Button>
                </VStack>
            </Box>
            <BottomSheet isVisible={isXpubVisible} onClose={setIsXpubVisible}>
                <QRCode data={account.descriptor} onCopy={handleCopyXpubToClipboardAndClose} />
            </BottomSheet>
        </Screen>
    );
};
