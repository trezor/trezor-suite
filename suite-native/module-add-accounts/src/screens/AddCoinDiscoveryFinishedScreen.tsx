import { useCallback, useMemo } from 'react';
import { View } from 'react-native';
import { useSelector } from 'react-redux';

import { FlashList } from '@shopify/flash-list';

import type { DeviceRootState } from '@suite-common/device';
import { getNetwork } from '@suite-common/wallet-config';
import {
    type AccountsRootState,
    selectDeviceAccountsByNetworkSymbol,
} from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { AccountsListItem } from '@suite-native/accounts';
import { AccountTypeDecisionBottomSheet, useAddCoinAccount } from '@suite-native/add-coin-account';
import { Box, Button, Text, TextDivider } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import {
    type AddCoinAccountStackParamList,
    type AddCoinAccountStackRoutes,
    Screen,
    ScreenHeader,
    type StackProps,
} from '@suite-native/navigation';
import { useScrollDivider } from '@suite-native/scrollview';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

const listFooterStyle = prepareNativeStyle(utils => ({
    backgroundColor: utils.colors.surfaceFillRaised,
    borderBottomLeftRadius: utils.borders.radii.r16,
    borderBottomRightRadius: utils.borders.radii.r16,
    paddingBottom: utils.spacings.sp16,
    ...utils.boxShadows.small,
}));

const getAccountKey = (account: Account) => account.key;

type AddAccountListFooterProps = {
    onPress: () => void;
};

const AddAccountListFooter = ({ onPress }: AddAccountListFooterProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <View style={applyStyle(listFooterStyle)}>
            <TextDivider
                title="moduleAddAccounts.coinDiscoveryFinishedScreen.orSeparator"
                lineColor="borderNeutral"
                textColor="contentSecondary"
            />
            <Box paddingTop="sp8" paddingHorizontal="sp16">
                <Button
                    intent="neutral"
                    priority="secondary"
                    onPress={onPress}
                    testID="@add-account/after-discovery/button-add-new"
                >
                    <Translation id="moduleAddAccounts.coinDiscoveryFinishedScreen.addButton" />
                </Button>
            </Box>
        </View>
    );
};

export const AddCoinDiscoveryFinishedScreen = ({
    route,
}: StackProps<
    AddCoinAccountStackParamList,
    AddCoinAccountStackRoutes.AddCoinDiscoveryFinished
>) => {
    const { networkSymbol, flowType } = route.params;

    const networkAccounts = useSelector((state: AccountsRootState & DeviceRootState) =>
        selectDeviceAccountsByNetworkSymbol(state, networkSymbol),
    );
    const accounts = useMemo(
        () => networkAccounts.filter(account => !account.empty),
        [networkAccounts],
    );

    const {
        navigateToSuccessorScreen,
        handleAccountTypeConfirmation,
        onSelectedNetworkItem,
        clearNetworkWithTypeToBeAdded,
        handleAccountTypeSelection,
        getAccountTypeToBeAddedName,
        bottomSheetRef,
    } = useAddCoinAccount();

    const { scrollDivider, handleScroll } = useScrollDivider();

    const handleSelectedAccount = useCallback(
        (account: Account) =>
            navigateToSuccessorScreen({
                flowType,
                symbol: networkSymbol,
                accountType: account.accountType,
                accountIndex: account.index,
            }),
        [flowType, navigateToSuccessorScreen, networkSymbol],
    );

    const handleAddAccount = () => onSelectedNetworkItem({ symbol: networkSymbol, flowType });

    const handleTypeSelectionTap = () => handleAccountTypeSelection(flowType);

    const handleConfirmTap = () => handleAccountTypeConfirmation(flowType);

    const renderItem = useCallback(
        ({ item, index }: { item: Account; index: number }) => (
            <AccountsListItem
                account={item}
                hasBackground
                isFirst={index === 0}
                onPress={() => handleSelectedAccount(item)}
            />
        ),
        [handleSelectedAccount],
    );

    const titleKey =
        accounts.length === 1
            ? 'moduleAddAccounts.coinDiscoveryFinishedScreen.title.singular'
            : 'moduleAddAccounts.coinDiscoveryFinishedScreen.title.plural';

    return (
        <Screen header={<ScreenHeader closeActionType="close" />} isScrollable={false}>
            <Box flex={1}>
                {scrollDivider}
                <FlashList
                    data={accounts}
                    keyExtractor={getAccountKey}
                    renderItem={renderItem}
                    ListHeaderComponent={
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
                    }
                    ListFooterComponent={<AddAccountListFooter onPress={handleAddAccount} />}
                    onScroll={handleScroll}
                />
            </Box>
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
