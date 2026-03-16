import { useSelector } from 'react-redux';

import type { DeviceRootState } from '@suite-common/device';
import { getNetwork } from '@suite-common/wallet-config';
import {
    type AccountsRootState,
    selectDeviceAccountsByNetworkSymbol,
} from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { AccountsListItem } from '@suite-native/accounts';
import { Box, Button, Card, Text, TextDivider } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import {
    type AddCoinAccountStackParamList,
    type AddCoinAccountStackRoutes,
    Screen,
    ScreenHeader,
    type StackProps,
} from '@suite-native/navigation';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

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
        clearNetworkWithTypeToBeAdded,
        handleAccountTypeSelection,
        getAccountTypeToBeAddedName,
        bottomSheetRef,
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
                <Text variant="headline-md">
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
                        intent="neutral"
                        priority="secondary"
                        onPress={handleAddAccount}
                        testID="@add-account/after-discovery/button-add-new"
                    >
                        <Translation id="moduleAddAccounts.coinDiscoveryFinishedScreen.addButton" />
                    </Button>
                </Box>
            </Card>
            <AccountTypeDecisionBottomSheet
                coinName={networkSymbol}
                typeName={getAccountTypeToBeAddedName()}
                ref={bottomSheetRef}
                onClose={clearNetworkWithTypeToBeAdded}
                onTypeSelectionTap={handleTypeSelectionTap}
                onConfirmTap={handleConfirmTap}
            />
        </Screen>
    );
};
