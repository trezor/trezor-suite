import React, { ReactNode, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { networks, NetworkSymbol, NetworkType } from '@suite-common/wallet-config';
import {
    AccountsStackParamList,
    AccountsStackRoutes,
    RootStackParamList,
    RootStackRoutes,
    Screen,
    ScreenHeader,
    StackToStackCompositeNavigationProps,
    StackProps,
} from '@suite-native/navigation';
import { BottomSheet, Box, Button, Card, Text, VStack } from '@suite-native/atoms';
import {
    accountsActions,
    AccountsRootState,
    selectAccountByKey,
    selectAccountLabel,
    selectFormattedAccountType,
} from '@suite-common/wallet-core';
import { QRCode } from '@suite-native/qr-code';
import { CryptoIcon } from '@trezor/icons';

import { AccountRenameButton } from '../components/AccountRenameButton';

const networkTypeToButtonTitleMap: Record<NetworkType, string> = {
    bitcoin: 'Show public key (XPUB)',
    cardano: 'Show public key (XPUB)',
    ethereum: 'Show receive address',
    ripple: 'Show receive address',
};

const AccountDetailSettingsRow = ({ title, children }: { title: string; children: ReactNode }) => (
    <Box flexDirection="row" alignItems="center" justifyContent="space-between">
        <Text variant="hint" color="textSubdued">
            {title}
        </Text>
        {children}
    </Box>
);

const CryptoNameWithIcon = ({ symbol }: { symbol: NetworkSymbol }) => (
    <Box flexDirection="row" alignItems="center" justifyContent="flex-end">
        <Text variant="hint">{networks[symbol].name}</Text>
        <Box marginLeft="small">
            <CryptoIcon name={symbol} size="extraSmall" />
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
            StackToStackCompositeNavigationProps<
                RootStackParamList,
                RootStackRoutes.AccountSettings,
                AccountsStackParamList
            >
        >();
    const dispatch = useDispatch();
    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );

    const accountLabel = useSelector((state: AccountsRootState) =>
        selectAccountLabel(state, accountKey),
    );

    const formattedAccountType = useSelector((state: AccountsRootState) =>
        selectFormattedAccountType(state, accountKey),
    );

    if (!account) return null;

    const handleRemoveAccount = () => {
        dispatch(accountsActions.removeAccount([account]));
        navigation.navigate(AccountsStackRoutes.Accounts);
    };

    const handleClose = () => {
        setIsXpubVisible(false);
    };

    const { networkType } = networks[account.symbol];
    const xpubButtonTitle = networkTypeToButtonTitleMap[networkType];

    return (
        <Screen
            header={
                <ScreenHeader
                    title={accountLabel}
                    rightIcon={<AccountRenameButton accountKey={accountKey} />}
                    titleVariant="body"
                />
            }
        >
            <Box flex={1} justifyContent="space-between">
                <Card>
                    <VStack spacing="large">
                        <AccountDetailSettingsRow title="Coin">
                            <CryptoNameWithIcon symbol={account.symbol} />
                        </AccountDetailSettingsRow>
                        {formattedAccountType && (
                            <AccountDetailSettingsRow title="Account type">
                                <Text variant="hint">{formattedAccountType}</Text>
                            </AccountDetailSettingsRow>
                        )}
                    </VStack>
                </Card>
                <VStack spacing="small">
                    <Button onPress={() => setIsXpubVisible(true)} colorScheme="tertiaryElevation0">
                        {xpubButtonTitle}
                    </Button>
                    <Button onPress={handleRemoveAccount} colorScheme="dangerElevation0">
                        Remove coin
                    </Button>
                </VStack>
            </Box>
            <BottomSheet isVisible={isXpubVisible} onClose={setIsXpubVisible}>
                <QRCode
                    data={account.descriptor}
                    onCopy={handleClose}
                    onCopyMessage="XPUB copied"
                />
            </BottomSheet>
        </Screen>
    );
};
