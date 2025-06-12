import { useSelector } from 'react-redux';

import { G } from '@mobily/ts-belt';

import { getNetwork } from '@suite-common/wallet-config';
import {
    AccountsRootState,
    DeviceRootState,
    selectDeviceAccountsByNetworkSymbol,
} from '@suite-common/wallet-core';
import { Account } from '@suite-common/wallet-types';
import { AccountsListItem } from '@suite-native/accounts';
import { Box, Button, Card, Text, TextDivider } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import {
    AddCoinAccountStackParamList,
    AddCoinAccountStackRoutes,
    Screen,
    ScreenHeader,
    StackProps,
} from '@suite-native/navigation';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { AccountTypeDecisionBottomSheet } from '../components/AccountTypeDecisionBottomSheet';
import { useAddCoinAccount } from '../hooks/useAddCoinAccount';

const accountsStyle = prepareNativeStyle(_ => ({ paddingHorizontal: 0, paddingTop: 0 }));

export const AddCoinDiscoveryFinishedScreen = ({
    route,
}: StackProps<
    AddCoinAccountStackParamList,
    AddCoinAccountStackRoutes.AddCoinDiscoveryFinished
>) => {
    const { networkSymbol, flowType } = route.params;

    const { applyStyle } = useNativeStyles();
    const accounts = useSelector((state: AccountsRootState & DeviceRootState) =>
        selectDeviceAccountsByNetworkSymbol(state, networkSymbol),
    ).filter(a => !a.empty);
    const {
        navigateToSuccessorScreen,
        handleAccountTypeConfirmation,
        onSelectedNetworkItem,
        networkSymbolWithTypeToBeAdded,
        clearNetworkWithTypeToBeAdded,
        handleAccountTypeSelection,
        getAccountTypeToBeAddedName,
    } = useAddCoinAccount();

    const handleSelectedAccount = (account: Account) =>
        navigateToSuccessorScreen({
            flowType,
            symbol: networkSymbol,
            accountType: account.accountType,
            accountIndex: account.index,
        });

    const handleAddAccount = () => onSelectedNetworkItem({ symbol: networkSymbol, flowType });

    const handleTypeSelectionTap = () => handleAccountTypeSelection(flowType);

    const handleConfirmTap = () => handleAccountTypeConfirmation(flowType);

    const titleKey =
        accounts.length === 1
            ? 'moduleAddAccounts.coinDiscoveryFinishedScreen.title.singular'
            : 'moduleAddAccounts.coinDiscoveryFinishedScreen.title.plural';

    return (
        <Screen header={<ScreenHeader closeActionType="close" />}>
            <Box paddingTop="sp24" paddingHorizontal="sp8" paddingBottom="sp32">
                <Text variant="titleMedium">
                    <Translation
                        id={titleKey}
                        values={{
                            count: accounts.length.toString(),
                            coin: getNetwork(networkSymbol).name,
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
                coinName={networkSymbol}
                typeName={getAccountTypeToBeAddedName()}
                isVisible={G.isNotNullable(networkSymbolWithTypeToBeAdded)}
                onClose={clearNetworkWithTypeToBeAdded}
                onTypeSelectionTap={handleTypeSelectionTap}
                onConfirmTap={handleConfirmTap}
            />
        </Screen>
    );
};
