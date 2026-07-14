import { useCallback } from 'react';

import { events } from '@suite-common/analytics';
import { useServices } from '@suite-common/dependency-injection';
import { AccountTypeDecisionBottomSheet, useAddCoinAccount } from '@suite-native/add-coin-account';
import { selectNativeAnalyticsDep } from '@suite-native/analytics';
import { VStack } from '@suite-native/atoms';
import { NetworkListItem } from '@suite-native/coin-enabling';
import { Icon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';
import {
    type AddCoinAccountStackParamList,
    type AddCoinAccountStackRoutes,
    Screen,
    type StackProps,
} from '@suite-native/navigation';
import { useScreenHeaderSearch } from '@suite-native/search';
import { isNotNullOrUndefined } from '@trezor/utils';

export const AddCoinAccountScreen = ({
    route,
}: StackProps<AddCoinAccountStackParamList, AddCoinAccountStackRoutes.AddCoinAccount>) => {
    const { analytics } = useServices(selectNativeAnalyticsDep);

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

    return (
        <Screen header={header}>
            <VStack spacing="sp12">
                {supportedNetworkSymbols.map(symbol => (
                    <NetworkListItem
                        key={symbol}
                        symbol={symbol}
                        accessory={<Icon name="caretRight" color="contentSecondary" />}
                        onPress={() =>
                            onSelectedNetworkItem({
                                symbol,
                                flowType,
                            })
                        }
                        accessibilityRole="button"
                        testID={`@onboarding/select-coin/${symbol}`}
                    />
                ))}
            </VStack>
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
