import { useSelector } from 'react-redux';

import { G } from '@mobily/ts-belt';

import {
    AccountsRootState,
    DeviceRootState,
    selectDeviceAccountsByNetworkSymbol,
} from '@suite-common/wallet-core';
import { AccountsListItem } from '@suite-native/accounts';
import { Card, Button, Text, TextDivider, Box } from '@suite-native/atoms';
import { GoBackIcon, Screen, ScreenSubHeader } from '@suite-native/navigation';
import { Account } from '@suite-common/wallet-types';
import { Translation } from '@suite-native/intl';
import { networks } from '@suite-common/wallet-config';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { useAddCoinAccount } from '../hooks/useAddCoinAccount';
import { AccountTypeDecisionBottomSheet } from '../components/AccountTypeDecisionBottomSheet';

const accountsStyle = prepareNativeStyle(_ => ({ paddingHorizontal: 0, paddingTop: 0 }));

export const AddCoinDiscoveryFinishedScreen = ({ route }) => {
    const { networkSymbol, flowType } = route.params;

    const { applyStyle } = useNativeStyles();
    const accounts = useSelector((state: AccountsRootState & DeviceRootState) =>
        selectDeviceAccountsByNetworkSymbol(state, networkSymbol),
    ).filter(a => !a.empty);
    const {
        navigateToSuccessorScreen,
        addCoinAccount,
        onSelectedNetworkItem,
        networkSymbolWithTypeToBeAdded,
        clearNetworkWithTypeToBeAdded,
        handleAccountTypeSelection,
        getAccountTypeToBeAddedName,
    } = useAddCoinAccount();

    const handleSelectedAccount = (account: Account) =>
        navigateToSuccessorScreen({
            flowType,
            networkSymbol,
            accountType: account.accountType,
            accountIndex: account.index,
        });

    const handleAddAccount = () => onSelectedNetworkItem({ networkSymbol, flowType });

    const handleTypeSelectionTap = () => handleAccountTypeSelection(flowType);

    const handleConfirmTap = () => {
        if (networkSymbolWithTypeToBeAdded) {
            // Timeout is needed so AccountTypeDecisionBottomSheet has time to hide otherwise app crashes
            setTimeout(() => {
                addCoinAccount({
                    networkSymbol: networkSymbolWithTypeToBeAdded[0],
                    accountType: networkSymbolWithTypeToBeAdded[1],
                    flowType,
                });
            }, 100);
            clearNetworkWithTypeToBeAdded();
        }
    };

    const titleKey =
        accounts.length === 1
            ? 'moduleAddAccounts.coinDiscoveryFinishedScreen.title.singular'
            : 'moduleAddAccounts.coinDiscoveryFinishedScreen.title.plural';

    return (
        <Screen
            screenHeader={<ScreenSubHeader leftIcon={<GoBackIcon closeActionType="close" />} />}
        >
            <Box paddingTop="sp24" paddingHorizontal="sp8" paddingBottom="sp32">
                <Text variant="titleMedium">
                    <Translation
                        id={titleKey}
                        values={{
                            count: accounts.length.toString(),
                            coin: networks[networkSymbol].name,
                        }}
                    />
                </Text>
            </Box>
            <Card style={applyStyle(accountsStyle)}>
                {accounts.map(account => (
                    <AccountsListItem
                        key={account.key}
                        account={account}
                        onPress={() => handleSelectedAccount(account)}
                    />
                ))}
                <TextDivider
                    title="moduleAddAccounts.coinDiscoveryFinishedScreen.orSeparator"
                    lineColor="borderElevation0"
                    textColor="textSubdued"
                />
                <Box paddingTop="sp8" paddingHorizontal="sp16">
                    <Button
                        colorScheme="tertiaryElevation0"
                        onPress={handleAddAccount}
                        testID="@add-account/after-discovery/button-add-new"
                    >
                        <Translation id="moduleAddAccounts.coinDiscoveryFinishedScreen.addNewButton" />
                    </Button>
                </Box>
            </Card>
            <AccountTypeDecisionBottomSheet
                coinName={
                    G.isNotNullable(networkSymbolWithTypeToBeAdded)
                        ? networkSymbolWithTypeToBeAdded[0]
                        : ''
                }
                typeName={getAccountTypeToBeAddedName()}
                isVisible={G.isNotNullable(networkSymbolWithTypeToBeAdded)}
                onClose={clearNetworkWithTypeToBeAdded}
                onTypeSelectionTap={handleTypeSelectionTap}
                onConfirmTap={handleConfirmTap}
            />
        </Screen>
    );
};
