import React, { ReactNode, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import * as Clipboard from 'expo-clipboard';
import { useNavigation } from '@react-navigation/native';

import { networks } from '@suite-common/wallet-config';
import {
    AccountsStackParamList,
    AccountsStackRoutes,
    Screen,
    ScreenHeader,
    StackNavigationProps,
    StackProps,
} from '@suite-native/navigation';
import { BottomSheet, Box, Button, Card, Input, Text, VStack } from '@suite-native/atoms';
import {
    accountsActions,
    AccountsRootState,
    selectAccountByKey,
    selectAccountLabel,
} from '@suite-common/wallet-core';
import { QRCode } from '@suite-native/accounts';
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

export const AccountDetailSettings = ({
    route,
}: StackProps<AccountsStackParamList, AccountsStackRoutes.AccountDetailSettings>) => {
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
    const accountName = useSelector((state: AccountsRootState) =>
        selectAccountLabel(state, accountKey),
    );

    if (!account) return null;

    const handleRemoveAccount = () => {
        dispatch(accountsActions.removeAccount([account]));
        navigation.navigate(AccountsStackRoutes.Accounts);
    };

    const handleCopyXpubToClipboardAndClose = async () => {
        await Clipboard.setStringAsync(account.descriptor);
        setIsXpubVisible(false);
    };

    // console.log(deriveAddresses(account.descriptor, 'receive', 0, 10));
    console.log(account.path);

    return (
        <Screen header={<ScreenHeader />}>
            <Box marginBottom="small">
                <Input label="Account Name" value={accountName ?? ''} />
            </Box>
            <Box flex={1} justifyContent="space-between">
                <Card>
                    <VStack spacing="large">
                        <AccountDetailSettingsRow
                            title="Coin"
                            value={networks[account.symbol].name}
                        />
                        <AccountDetailSettingsRow title="Account Type" value="SegWit" />
                        <AccountDetailSettingsRow
                            title="Derivation Path"
                            value="m/44'/60'/0'/0'/0"
                        />
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
            <BottomSheet isVisible={isXpubVisible} onVisibilityChange={setIsXpubVisible}>
                <QRCode address={account.descriptor} onCopy={handleCopyXpubToClipboardAndClose} />
            </BottomSheet>
        </Screen>
    );
};
