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
import {
    accountsActions,
    AccountsRootState,
    selectAccountByKey,
    selectAccountLabel,
} from '@suite-common/wallet-core';
import { QRCode } from '@suite-native/qr-code';
import { CryptoIcon } from '@trezor/icons';

import { AccountRenameButton } from '../components/AccountRenameButton';

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

    const accountLabel = useSelector((state: AccountsRootState) =>
        selectAccountLabel(state, accountKey),
    );

    if (!account) return null;

    const handleRemoveAccount = () => {
        dispatch(accountsActions.removeAccount([account]));
        navigation.navigate(AccountsStackRoutes.Accounts);
    };

    const handleClose = () => {
        setIsXpubVisible(false);
    };

    return (
        <Screen
            header={
                <ScreenHeader
                    title={accountLabel}
                    rightIcon={<AccountRenameButton accountKey={accountKey} />}
                />
            }
        >
            <Box flex={1} justifyContent="space-between">
                <Card>
                    <VStack spacing="large">
                        <AccountDetailSettingsRow
                            title="Coin"
                            value={<CryptoNameWithIcon symbol={account.symbol} />}
                        />
                    </VStack>
                </Card>
                <VStack spacing="small">
                    <Button onPress={() => setIsXpubVisible(true)} colorScheme="tertiary">
                        View XPUB
                    </Button>
                    <Button onPress={handleRemoveAccount} colorScheme="danger">
                        Remove Account
                    </Button>
                </VStack>
            </Box>
            <BottomSheet isVisible={isXpubVisible} onClose={setIsXpubVisible}>
                <QRCode data={account.descriptor} onCopy={handleClose} />
            </BottomSheet>
        </Screen>
    );
};
