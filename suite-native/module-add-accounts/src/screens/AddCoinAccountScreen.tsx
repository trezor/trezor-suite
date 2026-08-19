import { useCallback } from 'react';
import { View } from 'react-native';

import { FlashList } from '@shopify/flash-list';

import { events } from '@suite-common/analytics';
import { useServices } from '@suite-common/dependency-injection';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { AccountTypeDecisionBottomSheet, useAddCoinAccount } from '@suite-native/add-coin-account';
import { selectNativeAnalyticsDep } from '@suite-native/analytics';
import { Box } from '@suite-native/atoms';
import { NetworkListItem } from '@suite-native/coin-enabling';
import { Icon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';
import {
    type AddCoinAccountStackParamList,
    type AddCoinAccountStackRoutes,
    Screen,
    type StackProps,
} from '@suite-native/navigation';
import { useScrollDivider } from '@suite-native/scrollview';
import { SearchNoResults, useScreenHeaderSearch } from '@suite-native/search';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';
import { isNotNullOrUndefined } from '@trezor/utils';

const listSeparatorStyle = prepareNativeStyle(utils => ({
    height: utils.spacings.sp12,
}));

const NETWORK_LIST_ITEM_ACCESSORY = <Icon name="caretRight" color="contentSecondary" />;

const getNetworkSymbolKey = (symbol: NetworkSymbol) => symbol;

const NetworkListSeparator = () => {
    const { applyStyle } = useNativeStyles();

    return <View style={applyStyle(listSeparatorStyle)} />;
};

export const AddCoinAccountScreen = ({
    route,
}: StackProps<AddCoinAccountStackParamList, AddCoinAccountStackRoutes.AddCoinAccount>) => {
    const { analytics } = useServices(selectNativeAnalyticsDep);

    const { scrollDivider, handleScroll } = useScrollDivider();

    const reportSearchAnalytics = useCallback(
        () =>
            analytics.report({
                type: events.settingsNetworkSearchUsedEvent.name,
                payload: { platform: 'mobile', origin: 'add-account' },
            }),
        [analytics],
    );

    const { header, searchQuery } = useScreenHeaderSearch({
        title: <Translation id="moduleAddAccounts.addCoinAccountScreen.title" />,
        closeActionType: 'close',
        isCompactOnly: true,
        onSearchUsed: reportSearchAnalytics,
    });

    const {
        supportedNetworkSymbols,
        onSelectedNetworkItem,
        networkSymbolWithTypeToBeAdded,
        clearNetworkWithTypeToBeAdded,
        handleAccountTypeSelection,
        handleAccountTypeConfirmation,
        getAccountTypeToBeAddedName,
        bottomSheetRef,
    } = useAddCoinAccount(searchQuery);

    const { flowType } = route.params;

    const handleTypeSelectionTap = () => handleAccountTypeSelection(flowType);
    const handleConfirmTap = () => handleAccountTypeConfirmation(flowType);

    const renderItem = useCallback(
        ({ item: symbol }: { item: NetworkSymbol }) => (
            <NetworkListItem
                symbol={symbol}
                accessory={NETWORK_LIST_ITEM_ACCESSORY}
                onPress={() => onSelectedNetworkItem({ symbol, flowType })}
                accessibilityRole="button"
                testID={`@onboarding/select-coin/${symbol}`}
            />
        ),
        [flowType, onSelectedNetworkItem],
    );

    return (
        <Screen header={header} isScrollable={false}>
            {supportedNetworkSymbols.length === 0 ? (
                <SearchNoResults />
            ) : (
                <Box flex={1}>
                    {scrollDivider}
                    <FlashList
                        data={supportedNetworkSymbols}
                        keyExtractor={getNetworkSymbolKey}
                        renderItem={renderItem}
                        ItemSeparatorComponent={NetworkListSeparator}
                        keyboardShouldPersistTaps="handled"
                        onScroll={handleScroll}
                    />
                </Box>
            )}
            <AccountTypeDecisionBottomSheet
                coinName={
                    isNotNullOrUndefined(networkSymbolWithTypeToBeAdded)
                        ? networkSymbolWithTypeToBeAdded[0]
                        : ''
                }
                typeName={getAccountTypeToBeAddedName()}
                ref={bottomSheetRef}
                onClose={clearNetworkWithTypeToBeAdded}
                onTypeSelectionTap={handleTypeSelectionTap}
                onConfirmTap={handleConfirmTap}
            />
        </Screen>
    );
};
